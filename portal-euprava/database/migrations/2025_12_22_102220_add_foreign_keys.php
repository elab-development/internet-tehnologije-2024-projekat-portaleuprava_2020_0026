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
        // services -> institutions.
        Schema::table('services', function (Blueprint $table) {
            $table->foreign('institution_id')
                ->references('id')
                ->on('institutions')
                ->cascadeOnDelete();
        });

        // service_fields -> services.
        Schema::table('service_fields', function (Blueprint $table) {
            $table->foreign('service_id')
                ->references('id')
                ->on('services')
                ->cascadeOnDelete();
        });

        // service_requests -> users/services.
        Schema::table('service_requests', function (Blueprint $table) {
            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->cascadeOnDelete();

            $table->foreign('service_id')
                ->references('id')
                ->on('services')
                ->cascadeOnDelete();

            // Officer reference, should be nullable (set in add_nullable_constraints).
            $table->foreign('processed_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('service_requests', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropForeign(['service_id']);
            $table->dropForeign(['processed_by']);
        });

        Schema::table('service_fields', function (Blueprint $table) {
            $table->dropForeign(['service_id']);
        });

        Schema::table('services', function (Blueprint $table) {
            $table->dropForeign(['institution_id']);
        });
    }
};
