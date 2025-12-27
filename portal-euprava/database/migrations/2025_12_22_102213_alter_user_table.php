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
        Schema::table('users', function (Blueprint $table) {
            // Align users table with the User model fields.
            // No defaults and no nullable here, we handle those later via dedicated migrations.
            $table->date('date_of_birth')->after('password');     // Will become nullable later.
            $table->string('jmbg', 13)->unique()->after('date_of_birth'); // Will become nullable later.
            $table->string('role')->after('jmbg');                // Default added later.
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['jmbg']);
            $table->dropColumn(['date_of_birth', 'jmbg', 'role']);
        });
    }
};
