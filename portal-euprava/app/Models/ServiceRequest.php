<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ServiceRequest extends Model
{
    use HasFactory;
    // Pretpostavka: user_id, service_id, processed_by, status, citizen_note, officer_note,
    // attachment, form_data, payment_status, payment_date.
    protected $fillable = [
        'user_id',
        'service_id',
        'processed_by',
        'status',
        'citizen_note',
        'officer_note',
        'attachment',
        'form_data',
        'payment_status',
        'payment_date',
    ];

    protected function casts(): array
    {
        return [
            'form_data' => 'array',
            'payment_date' => 'datetime',
        ];
    }

    // N ServiceRequest -> 1 User (citizen/podnosilac).
    public function citizen(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // N ServiceRequest -> 1 User (officer koji je obradio) - može biti null.
    public function officer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    // N ServiceRequest -> 1 Service.
    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class, 'service_id');
    }
}
