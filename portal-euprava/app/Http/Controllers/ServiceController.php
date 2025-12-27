<?php

namespace App\Http\Controllers;

use App\Http\Resources\ServiceResource;
use App\Models\Service;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    private function requireAdmin(Request $request)
    {
        if (!$request->user() || $request->user()->role !== 'ADMIN') {
            abort(403, 'Nemate dozvolu za ovu akciju.');
        }
    }

    // GET: lista servisa (citizen/officer/admin). Po defaultu samo ACTIVE za ne-admin.
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Service::query()->with(['institution']);

        if (!$user || $user->role !== 'ADMIN') {
            $query->where('status', 'ACTIVE');
        }

        // Optional filter: institution_id.
        if ($request->filled('institution_id')) {
            $query->where('institution_id', $request->integer('institution_id'));
        }

        $services = $query->orderBy('name')->get();

        return ServiceResource::collection($services);
    }

    // GET: detalji servisa (sa fields).
    public function show(Request $request, Service $service)
    {
        $user = $request->user();

        if ((!$user || $user->role !== 'ADMIN') && $service->status !== 'ACTIVE') {
            abort(404);
        }

        $service->load(['institution', 'fields']);
        return new ServiceResource($service);
    }

    // POST: admin kreira servis.
    public function store(Request $request)
    {
        $this->requireAdmin($request);

        $data = $request->validate([
            'institution_id' => 'required|integer|exists:institutions,id',
            'name' => 'required|string|max:255|unique:services,name',
            'description' => 'nullable|string',
            'fee' => 'required|numeric|min:0',
            'requires_attachment' => 'required|boolean',
            'status' => 'required|in:ACTIVE,INACTIVE',
        ]);

        $service = Service::create($data);

        return (new ServiceResource($service->load('institution')))
            ->response()
            ->setStatusCode(201);
    }

    // PUT: admin menja servis.
    public function update(Request $request, Service $service)
    {
        $this->requireAdmin($request);

        $data = $request->validate([
            'institution_id' => 'sometimes|integer|exists:institutions,id',
            'name' => 'sometimes|string|max:255|unique:services,name,' . $service->id,
            'description' => 'sometimes|nullable|string',
            'fee' => 'sometimes|numeric|min:0',
            'requires_attachment' => 'sometimes|boolean',
            'status' => 'sometimes|in:ACTIVE,INACTIVE',
        ]);

        $service->update($data);

        return new ServiceResource($service->fresh()->load('institution'));
    }

    // DELETE: admin briše servis.
    public function destroy(Request $request, Service $service)
    {
        $this->requireAdmin($request);

        $service->delete();

        return response()->json(['message' => 'Servis obrisan.']);
    }
}
