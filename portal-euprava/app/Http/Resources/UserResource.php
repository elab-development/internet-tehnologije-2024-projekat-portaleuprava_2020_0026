<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\User */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $auth = $request->user();
        $isSelf = $auth && $auth->id === $this->id;
        $isAdmin = $auth && $auth->role === 'ADMIN';

        return [
            'id' => $this->id,
            'name' => $this->name,

            // Email može da vidi korisnik sam i admin.
            'email' => ($isSelf || $isAdmin) ? $this->email : null,

            'role' => $this->role,

            // Lični podaci samo self/admin.
            'date_of_birth' => ($isSelf || $isAdmin) ? optional($this->date_of_birth)->format('Y-m-d') : null,
            'jmbg' => ($isSelf || $isAdmin) ? $this->jmbg : null,

            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
        ];
    }
}
