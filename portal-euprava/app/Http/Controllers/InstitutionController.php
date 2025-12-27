<?php

namespace App\Http\Controllers;

use App\Http\Resources\InstitutionResource;
use App\Models\Institution;
use Illuminate\Http\Request;

class InstitutionController extends Controller
{
    private function requireAdmin(Request $request)
    {
        if (!$request->user() || $request->user()->role !== 'ADMIN') {
            abort(403, 'Nemate dozvolu za ovu akciju.');
        }
    }

    public function index(Request $request)
    {
        $this->requireAdmin($request);

        $institutions = Institution::with('services')->orderBy('name')->get();
        return InstitutionResource::collection($institutions);
    }

    public function show(Request $request, Institution $institution)
    {
        $this->requireAdmin($request);

        $institution->load('services');
        return new InstitutionResource($institution);
    }

    public function store(Request $request)
    {
        $this->requireAdmin($request);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'email' => 'nullable|email:rfc,dns|max:255',
        ]);

        $institution = Institution::create($data);

        return (new InstitutionResource($institution))
            ->response()
            ->setStatusCode(201);
    }

    public function update(Request $request, Institution $institution)
    {
        $this->requireAdmin($request);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'city' => 'sometimes|string|max:255',
            'address' => 'sometimes|string|max:255',
            'email' => 'sometimes|nullable|email:rfc,dns|max:255',
        ]);

        $institution->update($data);

        return new InstitutionResource($institution->fresh());
    }

    public function destroy(Request $request, Institution $institution)
    {
        $this->requireAdmin($request);

        $institution->delete();

        return response()->json(['message' => 'Institucija obrisana.']);
    }
}
