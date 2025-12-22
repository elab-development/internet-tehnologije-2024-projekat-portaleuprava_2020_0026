<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {

                // 1) institutions.
        Schema::create('institutions', function (Blueprint $table) {
            $table->id();

            $table->string('name');
            $table->string('city');
            $table->string('address');
            $table->string('email'); // Will become nullable later in add_nullable_constraints.

            $table->timestamps();
        });

        // 2) services.
        Schema::create('services', function (Blueprint $table) {
            $table->id();

            // No FK constraint here, it will be added in add_foreign_keys.
            $table->unsignedBigInteger('institution_id')->index();

            $table->string('name')->unique();
            $table->text('description'); // Will become nullable later.
            $table->decimal('fee', 10, 2); // Default added later.
            $table->boolean('requires_attachment'); // Default added later.
            $table->string('status'); // Default added later.

            $table->timestamps();
        });

        // 3) service_fields.
        Schema::create('service_fields', function (Blueprint $table) {
            $table->id();

            // No FK constraint here, it will be added in add_foreign_keys.
            $table->unsignedBigInteger('service_id')->index();

            $table->string('key');
            $table->string('label');
            $table->string('data_type'); // STRING, NUMBER, DATE, BOOLEAN, SELECT, FILE.
            $table->boolean('is_required'); // Default added later.

            $table->json('options'); // Will become nullable later.
            $table->json('validation_rules'); // Will become nullable later.
            $table->unsignedInteger('sort_order'); // Default added later.

            $table->timestamps();

            $table->unique(['service_id', 'key']);
        });

        // 4) service_requests.
        Schema::create('service_requests', function (Blueprint $table) {
            $table->id();

            // No FK constraints here, they will be added in add_foreign_keys.
            $table->unsignedBigInteger('user_id')->index();       // citizen.
            $table->unsignedBigInteger('service_id')->index();    // service.
            $table->unsignedBigInteger('processed_by')->index();  // officer, will become nullable later.

            $table->string('status'); // Default added later.

            $table->text('citizen_note'); // Will become nullable later.
            $table->text('officer_note'); // Will become nullable later.

            $table->string('attachment'); // Will become nullable later.
            $table->json('form_data'); // Will become nullable later.

            $table->string('payment_status'); // Default added later.
            $table->dateTime('payment_date'); // Will become nullable later.

            $table->timestamps();
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_requests');
        Schema::dropIfExists('service_fields');
        Schema::dropIfExists('services');
        Schema::dropIfExists('institutions');
    }
};
