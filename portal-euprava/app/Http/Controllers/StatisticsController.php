<?php

namespace App\Http\Controllers;

use App\Models\Service;
use App\Models\ServiceRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StatisticsController extends Controller
{
    /**
     * GET /stats
     * Vraća metrike u zavisnosti od uloge.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if (!in_array($user->role, ['CITIZEN', 'OFFICER', 'ADMIN'], true)) {
            abort(403, 'Nemate dozvolu za ovu akciju.');
        }

        // Base query filter by role.
        $base = ServiceRequest::query();

        if ($user->role === 'CITIZEN') {
            $base->where('user_id', $user->id);
        } elseif ($user->role === 'OFFICER') {
            // Officer: assigned to him + unassigned submitted (inbox).
            $base->where(function ($q) use ($user) {
                $q->where('processed_by', $user->id)
                  ->orWhere(function ($qq) {
                      $qq->where('status', 'SUBMITTED')->whereNull('processed_by');
                  });
            });
        } // ADMIN: no filter.

        // 1) Total requests.
        $totalRequests = (clone $base)->count();

        // 2) Count by status.
        $byStatus = (clone $base)
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->orderBy('status')
            ->get()
            ->map(fn ($r) => ['status' => $r->status, 'total' => (int) $r->total]);

        // 3) Requests per service (Top 5).
        $topServices = (clone $base)
            ->select('service_id', DB::raw('COUNT(*) as total'))
            ->groupBy('service_id')
            ->orderByDesc('total')
            ->limit(5)
            ->get()
            ->map(function ($r) {
                $service = Service::find($r->service_id);
                return [
                    'service_id' => (int) $r->service_id,
                    'service_name' => $service?->name,
                    'total' => (int) $r->total,
                ];
            });

        // 4) Monthly trend (last 6 months) - using created_at.
        // MySQL: DATE_FORMAT(created_at, '%Y-%m')
        $monthly = (clone $base)
            ->select(DB::raw("DATE_FORMAT(created_at, '%Y-%m') as ym"), DB::raw('COUNT(*) as total'))
            ->where('created_at', '>=', now()->subMonths(5)->startOfMonth())
            ->groupBy('ym')
            ->orderBy('ym')
            ->get()
            ->map(fn ($r) => ['month' => $r->ym, 'total' => (int) $r->total]);

        // 5) Officer-specific: assigned count (only if OFFICER/ADMIN).
        $assignedToMe = null;
        if ($user->role === 'OFFICER') {
            $assignedToMe = ServiceRequest::where('processed_by', $user->id)->count();
        }

        return response()->json([
            'role' => $user->role,
            'total_requests' => $totalRequests,
            'by_status' => $byStatus,
            'top_services' => $topServices,
            'monthly_trend' => $monthly,
            'assigned_to_me' => $assignedToMe,
        ]);
    }
}
