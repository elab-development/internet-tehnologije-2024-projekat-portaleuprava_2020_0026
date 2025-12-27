<!doctype html>
<html lang="sr">
<head>
    <meta charset="utf-8">
    <title>Portal eUprava - Zahtev #{{ $sr->id }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; }
        .title { font-size: 18px; font-weight: bold; margin-bottom: 6px; }
        .subtitle { color: #444; margin-bottom: 16px; }
        .box { border: 1px solid #ddd; padding: 10px; margin-bottom: 12px; }
        .row { margin-bottom: 6px; }
        .label { font-weight: bold; display: inline-block; width: 160px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
        th { background: #f5f5f5; }
        .status { font-weight: bold; }
        .muted { color: #666; }
    </style>
</head>
<body>
    <div class="title">Portal eUprava – Zahtev #{{ $sr->id }}</div>
    <div class="subtitle muted">
        Datum kreiranja: {{ optional($sr->created_at)->format('d.m.Y H:i') }} |
        Poslednja izmena: {{ optional($sr->updated_at)->format('d.m.Y H:i') }}
    </div>

    <div class="box">
        <div class="row"><span class="label">Status:</span> <span class="status">{{ $sr->status }}</span></div>
        <div class="row"><span class="label">Servis:</span> {{ $sr->service->name }}</div>
        <div class="row"><span class="label">Taksa:</span> {{ number_format((float)$sr->service->fee, 2) }} RSD</div>
        <div class="row"><span class="label">Institucija:</span> {{ $sr->service->institution->name }}</div>
        <div class="row"><span class="label">Adresa:</span> {{ $sr->service->institution->address }}, {{ $sr->service->institution->city }}</div>
    </div>

    <div class="box">
        <div class="row"><span class="label">Podnosilac:</span> {{ $sr->citizen->name }}</div>
        <div class="row"><span class="label">Email:</span> {{ $sr->citizen->email }}</div>
    </div>

    <div class="box">
        <div class="row"><span class="label">Payment status:</span> {{ $sr->payment_status }}</div>
        <div class="row"><span class="label">Payment date:</span> {{ $sr->payment_date ? $sr->payment_date->format('d.m.Y H:i') : '-' }}</div>
        <div class="row"><span class="label">Attachment:</span> {{ $sr->attachment ?? '-' }}</div>
    </div>

    <div class="box">
        <div class="row"><span class="label">Napomena građanina:</span> {{ $sr->citizen_note ?? '-' }}</div>
        <div class="row"><span class="label">Napomena službenika:</span> {{ $sr->officer_note ?? '-' }}</div>
        <div class="row"><span class="label">Službenik:</span> {{ $sr->officer?->name ?? '-' }}</div>
    </div>

    <div class="box">
        <div class="row"><span class="label">Podaci iz forme:</span></div>
        <table>
            <thead>
                <tr>
                    <th>Polje</th>
                    <th>Vrednost</th>
                </tr>
            </thead>
            <tbody>
                @forelse($formRows as $r)
                    <tr>
                        <td>{{ $r['label'] }}</td>
                        <td>{{ $r['value'] ?? '-' }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="2">Nema definisanih polja za ovaj servis.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>
</body>
</html>
