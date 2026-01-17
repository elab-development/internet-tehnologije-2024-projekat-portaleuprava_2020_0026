<?php

namespace App\Http\Controllers;

use App\Models\ServiceRequest;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class ServiceRequestPdfController extends Controller
{
    private function canView(Request $request, ServiceRequest $sr): bool
    {
        $user = $request->user();

        if ($user->role === 'ADMIN') {
            return true;
        }

        if ($user->role === 'CITIZEN') {
            return $sr->user_id === $user->id;
        }

        if ($user->role === 'OFFICER') {
            // Officer: dodeljeni njemu, plus SUBMITTED (nedodeljeni) po potrebi.
            return $sr->processed_by === $user->id
                || ($sr->status === 'SUBMITTED' && $sr->processed_by === null);
        }

        return false;
    }

    /**
     * GET /service-requests/{serviceRequest}/pdf
     * Export jednog zahteva u PDF (potvrda/odluka).
     */
    public function download(Request $request, ServiceRequest $serviceRequest)
    {
        if (! $this->canView($request, $serviceRequest)) {
            abort(403, 'Nemate dozvolu da preuzmete PDF za ovaj zahtev.');
        }

        $serviceRequest->load([
            'citizen',
            'officer',
            'service.institution',
            'service.fields',
        ]);

        // Data za prikaz polja forme: label + value.
        $formRows = [];
        $formData = is_array($serviceRequest->form_data) ? $serviceRequest->form_data : [];

        foreach ($serviceRequest->service->fields->sortBy('sort_order') as $field) {
            $value = $formData[$field->key] ?? null;

            // Lepši prikaz vrednosti.
            if (is_array($value)) {
                $value = implode(', ', $value);
            } elseif (is_bool($value)) {
                $value = $value ? 'Da' : 'Ne';
            }

            $formRows[] = [
                'label' => $field->label,
                'key' => $field->key,
                'value' => $value,
            ];
        }

        $pdf = Pdf::loadView('pdf.service_request', [
            'sr' => $serviceRequest,
            'formRows' => $formRows,
        ])->setPaper('a4');

        $fileName = 'zahtev_' . $serviceRequest->id . '.pdf';

        // download() da browser automatski skine fajl.
        return $pdf->download($fileName);
    }
}
