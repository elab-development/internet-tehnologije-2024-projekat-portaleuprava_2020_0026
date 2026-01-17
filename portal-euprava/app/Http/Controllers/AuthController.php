<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email:rfc,dns|unique:users,email',
            'password' => 'required|string|min:6',
            'date_of_birth' => 'required|date',
            'jmbg' => 'required|string|size:13|unique:users,jmbg',
        ]);

        // Registracija je samo za građane.
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'date_of_birth' => $data['date_of_birth'],
            'jmbg' => $data['jmbg'],
            'role' => 'CITIZEN',
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Korisnik uspešno registrovan.',
            'user' => new UserResource($user),
            'token' => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if (!Auth::attempt(['email' => $data['email'], 'password' => $data['password']])) {
            return response()->json(['message' => 'Neispravni podaci za prijavu.'], 401);
        }

        /** @var \App\Models\User $user */
        $user = Auth::user();

        // (Opcionalno) obriši stare tokene.
        // $user->tokens()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Uspešno ste se prijavili.',
            'user' => new UserResource($user),
            'token' => $token,
        ]);
    }

    public function me(Request $request)
    {
        return new UserResource($request->user());
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Uspešno ste se odjavili.']);
    }
}
