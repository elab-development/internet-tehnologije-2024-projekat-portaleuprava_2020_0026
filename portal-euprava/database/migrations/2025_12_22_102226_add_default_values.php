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
        // users defaults.
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('CITIZEN')->change();
        });

        // services defaults.
        Schema::table('services', function (Blueprint $table) {
            $table->decimal('fee', 10, 2)->default(0)->change();
            $table->boolean('requires_attachment')->default(false)->change();
            $table->string('status')->default('ACTIVE')->change();
        });

        // service_fields defaults.
        Schema::table('service_fields', function (Blueprint $table) {
            $table->boolean('is_required')->default(false)->change();
            $table->unsignedInteger('sort_order')->default(0)->change();
        });

        // service_requests defaults.
        Schema::table('service_requests', function (Blueprint $table) {
            $table->string('status')->default('DRAFT')->change();
            $table->string('payment_status')->default('NOT_REQUIRED')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert defaults back to no-default (NULL default) behavior.
        // Some DBs may not fully remove defaults cleanly, but this is the usual approach.

        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default(null)->change();
        });

        Schema::table('services', function (Blueprint $table) {
            $table->decimal('fee', 10, 2)->default(null)->change();
            $table->boolean('requires_attachment')->default(null)->change();
            $table->string('status')->default(null)->change();
        });

        Schema::table('service_fields', function (Blueprint $table) {
            $table->boolean('is_required')->default(null)->change();
            $table->unsignedInteger('sort_order')->default(null)->change();
        });

        Schema::table('service_requests', function (Blueprint $table) {
            $table->string('status')->default(null)->change();
            $table->string('payment_status')->default(null)->change();
        });
    }
};
