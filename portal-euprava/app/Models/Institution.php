<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Institution extends Model
{
    // Pretpostavka: name, city, address, email.
    protected $fillable = [
        'name',
        'city',
        'address',
        'email',
    ];

    // 1 Institution -> N Service.
    public function services(): HasMany
    {
        return $this->hasMany(Service::class, 'institution_id');
    }
}
