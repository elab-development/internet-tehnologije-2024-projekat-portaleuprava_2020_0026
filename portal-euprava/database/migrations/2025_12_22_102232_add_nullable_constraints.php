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
        // users nullable.
        Schema::table('users', function (Blueprint $table) {
            $table->date('date_of_birth')->nullable()->change();
            $table->string('jmbg', 13)->nullable()->change();
        });

        // institutions nullable.
        Schema::table('institutions', function (Blueprint $table) {
            $table->string('email')->nullable()->change();
        });

        // services nullable.
        Schema::table('services', function (Blueprint $table) {
            $table->text('description')->nullable()->change();
        });

        // service_fields nullable.
        Schema::table('service_fields', function (Blueprint $table) {
            $table->json('options')->nullable()->change();
            $table->json('validation_rules')->nullable()->change();
        });

        // service_requests nullable.
        Schema::table('service_requests', function (Blueprint $table) {
            $table->unsignedBigInteger('processed_by')->nullable()->change();

            $table->text('citizen_note')->nullable()->change();
            $table->text('officer_note')->nullable()->change();

            $table->string('attachment')->nullable()->change();
            $table->json('form_data')->nullable()->change();

            $table->dateTime('payment_date')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert nullable back to not-null.
        // Warning: if DB already contains NULL values, reverting can fail.

        Schema::table('users', function (Blueprint $table) {
            $table->date('date_of_birth')->nullable(false)->change();
            $table->string('jmbg', 13)->nullable(false)->change();
        });

        Schema::table('institutions', function (Blueprint $table) {
            $table->string('email')->nullable(false)->change();
        });

        Schema::table('services', function (Blueprint $table) {
            $table->text('description')->nullable(false)->change();
        });

        Schema::table('service_fields', function (Blueprint $table) {
            $table->json('options')->nullable(false)->change();
            $table->json('validation_rules')->nullable(false)->change();
        });

        Schema::table('service_requests', function (Blueprint $table) {
            $table->unsignedBigInteger('processed_by')->nullable(false)->change();

            $table->text('citizen_note')->nullable(false)->change();
            $table->text('officer_note')->nullable(false)->change();

            $table->string('attachment')->nullable(false)->change();
            $table->json('form_data')->nullable(false)->change();

            $table->dateTime('payment_date')->nullable(false)->change();
        });
    }
};
