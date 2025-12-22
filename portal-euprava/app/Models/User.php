<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Laravel\Sanctum\HasApiTokens;


class User extends Authenticatable
{
    use HasApiTokens;
    use HasFactory;
    use Notifiable;

    // Pretpostavka: u users tabeli postoje kolone: name, email, password, date_of_birth, jmbg, role.
    protected $fillable = [
        'name',
        'email',
        'password',
        'date_of_birth',
        'jmbg',
        'role',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'date_of_birth' => 'date',
        ];
    }

    // 1 User (citizen) -> N ServiceRequest (zahtevi koje je podneo).
    public function serviceRequests(): HasMany
    {
        return $this->hasMany(ServiceRequest::class, 'user_id');
    }

    // 1 User (officer) -> N ServiceRequest (zahtevi koje je obradio).
    public function processedRequests(): HasMany
    {
        return $this->hasMany(ServiceRequest::class, 'processed_by');
    }
}
