<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
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

        $users = User::orderBy('name')->get();
        return UserResource::collection($users);
    }

    public function show(Request $request, User $user)
    {
        $this->requireAdmin($request);
        return new UserResource($user);
    }

    // PATCH /users/{user}/role
    public function updateRole(Request $request, User $user)
    {
        $this->requireAdmin($request);

        $data = $request->validate([
            'role' => 'required|in:CITIZEN,OFFICER,ADMIN',
        ]);

        $user->update(['role' => $data['role']]);

        return new UserResource($user->fresh());
    }

    public function destroy(Request $request, User $user)
    {
        $this->requireAdmin($request);

        // Da admin ne obriše sebe.
        if ($request->user()->id === $user->id) {
            return response()->json(['message' => 'Ne možete obrisati sopstveni nalog.'], 422);
        }

        $user->delete();

        return response()->json(['message' => 'Korisnik obrisan.']);
    }
}
