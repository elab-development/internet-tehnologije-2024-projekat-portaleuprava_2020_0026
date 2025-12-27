<?php

namespace App\Http\Controllers;

use App\Http\Resources\ServiceFieldResource;
use App\Models\Service;
use App\Models\ServiceField;
use Illuminate\Http\Request;

class ServiceFieldController extends Controller
{
    private function requireAdmin(Request $request)
    {
        if (!$request->user() || $request->user()->role !== 'ADMIN') {
            abort(403, 'Nemate dozvolu za ovu akciju.');
        }
    }

    // GET /services/{service}/fields
    public function index(Request $request, Service $service)
    {
        // Svi ulogovani mogu da vide polja aktivnog servisa.
        if ($service->status !== 'ACTIVE' && $request->user()->role !== 'ADMIN') {
            abort(404);
        }

        $fields = $service->fields()->orderBy('sort_order')->get();
        return ServiceFieldResource::collection($fields);
    }

    // POST /services/{service}/fields (admin)
    public function store(Request $request, Service $service)
    {
        $this->requireAdmin($request);

        $data = $request->validate([
            'key' => 'required|string|max:255',
            'label' => 'required|string|max:255',
            'data_type' => 'required|in:STRING,NUMBER,DATE,BOOLEAN,SELECT,FILE',
            'is_required' => 'required|boolean',
            'options' => 'nullable|array',
            'validation_rules' => 'nullable|array',
            'sort_order' => 'required|integer|min:0',
        ]);

        $data['service_id'] = $service->id;

        $field = ServiceField::create($data);

        return (new ServiceFieldResource($field))
            ->response()
            ->setStatusCode(201);
    }

    // PUT /service-fields/{serviceField} (admin)
    public function update(Request $request, ServiceField $serviceField)
    {
        $this->requireAdmin($request);

        $data = $request->validate([
            'key' => 'sometimes|string|max:255',
            'label' => 'sometimes|string|max:255',
            'data_type' => 'sometimes|in:STRING,NUMBER,DATE,BOOLEAN,SELECT,FILE',
            'is_required' => 'sometimes|boolean',
            'options' => 'sometimes|nullable|array',
            'validation_rules' => 'sometimes|nullable|array',
            'sort_order' => 'sometimes|integer|min:0',
        ]);

        $serviceField->update($data);

        return new ServiceFieldResource($serviceField->fresh());
    }

    // DELETE /service-fields/{serviceField} (admin)
    public function destroy(Request $request, ServiceField $serviceField)
    {
        $this->requireAdmin($request);

        $serviceField->delete();

        return response()->json(['message' => 'Polje servisa obrisano.']);
    }
}
