<?php

namespace App\Http\Controllers;

use App\Http\Resources\ServiceRequestResource;
use App\Models\Service;
use App\Models\ServiceRequest;
use Illuminate\Http\Request;

class ServiceRequestController extends Controller
{
    private function requireRole(Request $request, array $roles)
    {
        $user = $request->user();
        if (!$user || !in_array($user->role, $roles, true)) {
            abort(403, 'Nemate dozvolu za ovu akciju.');
        }
    }

    private function canView(Request $request, ServiceRequest $sr): bool
    {
        $user = $request->user();

        if ($user->role === 'ADMIN') return true;

        if ($user->role === 'CITIZEN') {
            return $sr->user_id === $user->id;
        }

        if ($user->role === 'OFFICER') {
            // Officer vidi dodeljene njemu, plus SUBMITTED (nedodeljene) da bi ih preuzeo.
            return $sr->processed_by === $user->id || ($sr->status === 'SUBMITTED' && $sr->processed_by === null);
        }

        return false;
    }

    // GET /service-requests
    // Citizen: svoje. Officer: inbox (submitted) + assigned. Admin: sve.
    public function index(Request $request)
    {
        $this->requireRole($request, ['CITIZEN', 'OFFICER', 'ADMIN']);

        $user = $request->user();

        $query = ServiceRequest::query()
            ->with(['service.institution', 'citizen', 'officer']);

        if ($user->role === 'CITIZEN') {
            $query->where('user_id', $user->id);
        } elseif ($user->role === 'OFFICER') {
            // Officer: assigned to me OR submitted and unassigned.
            $query->where(function ($q) use ($user) {
                $q->where('processed_by', $user->id)
                  ->orWhere(function ($qq) {
                      $qq->where('status', 'SUBMITTED')->whereNull('processed_by');
                  });
            });
        } // ADMIN sees all.

        // Optional filters for frontend.
        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('service_id')) {
            $query->where('service_id', $request->integer('service_id'));
        }

        $items = $query->orderByDesc('created_at')->get();

        return ServiceRequestResource::collection($items);
    }

    // GET /service-requests/{serviceRequest}
    public function show(Request $request, ServiceRequest $serviceRequest)
    {
        $this->requireRole($request, ['CITIZEN', 'OFFICER', 'ADMIN']);

        if (!$this->canView($request, $serviceRequest)) {
            abort(403, 'Nemate dozvolu da vidite ovaj zahtev.');
        }

        $serviceRequest->load(['service.institution', 'citizen', 'officer', 'service.fields']);

        return new ServiceRequestResource($serviceRequest);
    }

    // POST /service-requests
    // Citizen kreira DRAFT.
    public function store(Request $request)
    {
        $this->requireRole($request, ['CITIZEN']);

        $data = $request->validate([
            'service_id' => 'required|integer|exists:services,id',
            'citizen_note' => 'nullable|string',
            'attachment' => 'nullable|string',
            'form_data' => 'nullable|array',
        ]);

        $service = Service::findOrFail($data['service_id']);
        if ($service->status !== 'ACTIVE') {
            return response()->json(['message' => 'Servis nije aktivan.'], 422);
        }

        $fee = (float) $service->fee;

        $sr = ServiceRequest::create([
            'user_id' => $request->user()->id,
            'service_id' => $service->id,
            'processed_by' => null,

            'status' => 'DRAFT',

            'citizen_note' => $data['citizen_note'] ?? null,
            'officer_note' => null,

            'attachment' => $data['attachment'] ?? null,
            'form_data' => $data['form_data'] ?? [],

            'payment_status' => $fee > 0 ? 'NOT_PAID' : 'NOT_REQUIRED',
            'payment_date' => null,
        ]);

        $sr->load(['service.institution', 'citizen', 'officer']);

        return (new ServiceRequestResource($sr))
            ->response()
            ->setStatusCode(201);
    }

    // PUT /service-requests/{serviceRequest}
    // Citizen menja samo svoj DRAFT.
    public function update(Request $request, ServiceRequest $serviceRequest)
    {
        $this->requireRole($request, ['CITIZEN', 'ADMIN']);

        $user = $request->user();

        if ($user->role === 'CITIZEN') {
            if ($serviceRequest->user_id !== $user->id) abort(403);
            if ($serviceRequest->status !== 'DRAFT') {
                return response()->json(['message' => 'Možete menjati samo DRAFT zahtev.'], 422);
            }
        }

        $data = $request->validate([
            'citizen_note' => 'nullable|string',
            'attachment' => 'nullable|string',
            'form_data' => 'nullable|array',
        ]);

        $serviceRequest->update($data);

        return new ServiceRequestResource($serviceRequest->fresh()->load(['service.institution', 'citizen', 'officer']));
    }

    // PATCH /service-requests/{serviceRequest}/submit
    // Citizen šalje zahtev: DRAFT -> SUBMITTED.
    public function submit(Request $request, ServiceRequest $serviceRequest)
    {
        $this->requireRole($request, ['CITIZEN']);

        if ($serviceRequest->user_id !== $request->user()->id) abort(403);
        if ($serviceRequest->status !== 'DRAFT') {
            return response()->json(['message' => 'Samo DRAFT zahtev može biti poslat.'], 422);
        }

        $serviceRequest->update([
            'status' => 'SUBMITTED',
        ]);

        return new ServiceRequestResource($serviceRequest->fresh()->load(['service.institution', 'citizen', 'officer']));
    }

    // PATCH /service-requests/{serviceRequest}/assign
    // Officer “preuzima” SUBMITTED zahtev: set processed_by + IN_REVIEW.
    public function assign(Request $request, ServiceRequest $serviceRequest)
    {
        $this->requireRole($request, ['OFFICER', 'ADMIN']);

        if ($serviceRequest->status !== 'SUBMITTED' || $serviceRequest->processed_by !== null) {
            return response()->json(['message' => 'Zahtev nije dostupan za preuzimanje.'], 422);
        }

        $serviceRequest->update([
            'processed_by' => $request->user()->id,
            'status' => 'IN_REVIEW',
        ]);

        return new ServiceRequestResource($serviceRequest->fresh()->load(['service.institution', 'citizen', 'officer']));
    }

    // PATCH /service-requests/{serviceRequest}/status
    // Officer odlučuje: APPROVED/REJECTED (mora biti dodeljen njemu).
    public function updateStatus(Request $request, ServiceRequest $serviceRequest)
    {
        $this->requireRole($request, ['OFFICER', 'ADMIN']);

        $user = $request->user();

        if ($user->role === 'OFFICER') {
            if ($serviceRequest->processed_by !== $user->id) {
                abort(403, 'Niste dodeljeni za ovaj zahtev.');
            }
        }

        $data = $request->validate([
            'status' => 'required|in:APPROVED,REJECTED',
            'officer_note' => 'nullable|string',
        ]);

        if (!in_array($serviceRequest->status, ['IN_REVIEW'], true)) {
            return response()->json(['message' => 'Status se može promeniti samo iz IN_REVIEW.'], 422);
        }

        $serviceRequest->update([
            'status' => $data['status'],
            'officer_note' => $data['officer_note'] ?? $serviceRequest->officer_note,
        ]);

        return new ServiceRequestResource($serviceRequest->fresh()->load(['service.institution', 'citizen', 'officer']));
    }

    // PATCH /service-requests/{serviceRequest}/payment
    // Admin (ili officer) ažurira payment (npr. kada uplata stigne).
    public function updatePayment(Request $request, ServiceRequest $serviceRequest)
    {
        $this->requireRole($request, ['OFFICER', 'ADMIN']);

        $data = $request->validate([
            'payment_status' => 'required|in:NOT_REQUIRED,NOT_PAID,PENDING,PAID',
        ]);

        $paymentDate = null;
        if ($data['payment_status'] === 'PAID') {
            $paymentDate = now();
        }

        $serviceRequest->update([
            'payment_status' => $data['payment_status'],
            'payment_date' => $paymentDate,
        ]);

        return new ServiceRequestResource($serviceRequest->fresh()->load(['service.institution', 'citizen', 'officer']));
    }

    // DELETE /service-requests/{serviceRequest}
    // Citizen briše samo svoj DRAFT. Admin može sve.
    public function destroy(Request $request, ServiceRequest $serviceRequest)
    {
        $this->requireRole($request, ['CITIZEN', 'ADMIN']);

        $user = $request->user();

        if ($user->role === 'CITIZEN') {
            if ($serviceRequest->user_id !== $user->id) abort(403);
            if ($serviceRequest->status !== 'DRAFT') {
                return response()->json(['message' => 'Možete obrisati samo DRAFT zahtev.'], 422);
            }
        }

        $serviceRequest->delete();

        return response()->json(['message' => 'Zahtev obrisan.']);
    }
}
