<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\InstitutionController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\ServiceFieldController;
use App\Http\Controllers\ServiceRequestController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ServiceRequestPdfController;
use App\Http\Controllers\StatisticsController;
use App\Http\Controllers\FileUploadController;
use Illuminate\Support\Facades\Route;

// Auth (PUBLIC).
Route::post('/auth/register', [AuthController::class, 'register']); // POST
Route::post('/auth/login', [AuthController::class, 'login']);      // POST

// Protected routes.
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);         // GET
    Route::post('/auth/logout', [AuthController::class, 'logout']); // POST

    // Services (GET for everyone logged in; admin CRUD inside controller).
    Route::get('/services', [ServiceController::class, 'index']);         // GET
    Route::get('/services/{service}', [ServiceController::class, 'show']); // GET
    Route::post('/services', [ServiceController::class, 'store']);        // POST
    Route::put('/services/{service}', [ServiceController::class, 'update']); // PUT
    Route::delete('/services/{service}', [ServiceController::class, 'destroy']); // DELETE

    // Service fields.
    Route::get('/services/{service}/fields', [ServiceFieldController::class, 'index']); // GET
    Route::post('/services/{service}/fields', [ServiceFieldController::class, 'store']); // POST
    Route::put('/service-fields/{serviceField}', [ServiceFieldController::class, 'update']); // PUT
    Route::delete('/service-fields/{serviceField}', [ServiceFieldController::class, 'destroy']); // DELETE

    // Institutions (admin).
    Route::apiResource('institutions', InstitutionController::class);

    // Service Requests.
    Route::get('/service-requests', [ServiceRequestController::class, 'index']); // GET
    Route::get('/service-requests/{serviceRequest}', [ServiceRequestController::class, 'show']); // GET
    Route::post('/service-requests', [ServiceRequestController::class, 'store']); // POST
    Route::put('/service-requests/{serviceRequest}', [ServiceRequestController::class, 'update']); // PUT
    Route::patch('/service-requests/{serviceRequest}/submit', [ServiceRequestController::class, 'submit']); // PATCH
    Route::patch('/service-requests/{serviceRequest}/assign', [ServiceRequestController::class, 'assign']); // PATCH
    Route::patch('/service-requests/{serviceRequest}/status', [ServiceRequestController::class, 'updateStatus']); // PATCH
    Route::patch('/service-requests/{serviceRequest}/payment', [ServiceRequestController::class, 'updatePayment']); // PATCH
    Route::delete('/service-requests/{serviceRequest}', [ServiceRequestController::class, 'destroy']); // DELETE

    // Users (admin).
    Route::get('/users', [UserController::class, 'index']); // GET
    Route::get('/users/{user}', [UserController::class, 'show']); // GET
    Route::patch('/users/{user}/role', [UserController::class, 'updateRole']); // PATCH
    Route::delete('/users/{user}', [UserController::class, 'destroy']); // DELETE

    // PDF export jednog zahteva.
    Route::get('/service-requests/{serviceRequest}/pdf', [ServiceRequestPdfController::class, 'download']);

    // Statistika i metrike.
    Route::get('/stats', [StatisticsController::class, 'index']);

    Route::post('/uploads/filebin', [FileUploadController::class, 'filebin']);
});
