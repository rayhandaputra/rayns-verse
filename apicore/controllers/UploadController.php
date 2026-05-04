<?php

class UploadController {
    private PDO $db;

    public function __construct(PDO $pdo) {
        $this->db = $pdo;
    }

    public function uploadImage(): void {
        // 1. Cek apakah file ada dan tidak ada error dari server
        if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            $errorCode = $_FILES['file']['error'] ?? 400;
            $msg = ($errorCode === UPLOAD_ERR_INI_SIZE) ? 'File melebihi batas php.ini' : 'No file uploaded';
            respond(['error' => $msg], 400);
        }

        $fileTmp   = $_FILES['file']['tmp_name'];
        $fileName  = $_FILES['file']['name'];
        $fileSize  = $_FILES['file']['size'];
        $fileType  = $_FILES['file']['type']; // Contoh: image/jpeg, application/pdf
        $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

        // ================= VALIDASI SIZE & TYPE =================
        
        // Cek apakah file adalah gambar (MIME type dimulai dengan 'image/')
        $isImage = strpos($fileType, 'image/') === 0;
        
        if ($isImage) {
            $maxSize = 20 * 1024 * 1024; // 7MB untuk gambar
            $errorMessage = "Ukuran gambar terlalu besar. Maksimal 20MB.";
        } else {
            $maxSize = 20 * 1024 * 1024; // 2MB untuk format non-gambar (PDF, ZIP, dll)
            $errorMessage = "Ukuran file terlalu besar. Maksimal 20MB.";
        }

        if ($fileSize > $maxSize) {
            respond(['error' => $errorMessage], 400);
        }

        // Aktifkan kembali allowed extensions demi keamanan
        $allowed = ['png', 'jpg', 'jpeg', 'gif', 'pdf', 'zip', 'webp'];
        if (!in_array($ext, $allowed)) {
            respond(['error' => 'Format file tidak didukung'], 400);
        }

        // ================= PROSES UPLOAD =================

        $uploadDir = __DIR__ . '/../resource/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $randomName = bin2hex(random_bytes(10)) . ".$ext";
        $targetPath = $uploadDir . $randomName;

        if (!move_uploaded_file($fileTmp, $targetPath)) {
            respond(['error' => 'Failed to save file'], 500);
        }

        $publicUrl = "https://" . $_SERVER['HTTP_HOST'] . "/api/resource/" . $randomName;

        respond([
            'status'   => 'ok',
            'url'      => $publicUrl,
            'filename' => $randomName,
            'original_name' => $fileName,
            'file_size' => $fileSize,
            'is_image'  => $isImage
        ]);
    }
}