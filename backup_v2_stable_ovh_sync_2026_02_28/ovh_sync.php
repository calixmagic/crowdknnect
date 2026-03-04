<?php
/**
 * OVH Sync Bridge pour Render.com
 * Déployez ce fichier sur votre hébergement OVH, par ex: https://votre-site.com/ovh_sync.php
 * Créez un dossier "uploads" et "state" au même endroit, avec permissions d'écriture (CHMOD 755 ou 777).
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Pre-flight CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$action = $_GET['action'] ?? '';
$secretKey = 'MAGIC2026'; // Changez ceci si besoin

// Sécurité basique
$providedKey = $_GET['key'] ?? '';
if ($action !== 'getstate' && $providedKey !== $secretKey) {
    http_response_code(403);
    echo json_encode(["error" => "Clé secrète invalide."]);
    exit;
}

$stateDir = __DIR__ . '/state';
$uploadsDir = __DIR__ . '/uploads';
$stateFile = $stateDir . '/state.json';

// Création des dossiers si inexistants
if (!is_dir($stateDir))
    mkdir($stateDir, 0755, true);
if (!is_dir($uploadsDir))
    mkdir($uploadsDir, 0755, true);

// 1. OBTENIR L'ETAT (GET)
// Render appelle ceci au réveil pour restaurer sa mémoire.
if ($action === 'getstate') {
    if (file_exists($stateFile)) {
        header('Content-Type: application/json');
        echo file_get_contents($stateFile);
    } else {
        echo json_encode(["status" => "empty"]);
    }
    exit;
}

// 2. SAUVEGARDER L'ETAT (POST json)
// Render appelle ceci quand l'Admin change une configuration.
if ($action === 'savestate') {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    if ($data !== null) {
        file_put_contents($stateFile, json_encode($data, JSON_PRETTY_PRINT));
        echo json_encode(["status" => "success", "message" => "Etat sauvegardé sur OVH"]);
    } else {
        http_response_code(400);
        echo json_encode(["error" => "Format JSON invalide"]);
    }
    exit;
}

// 3. UPLOADER UNE IMAGE (POST multipart/form-data)
// L'interface Admin appelle ceci pour stocker un logo.
if ($action === 'upload') {
    if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(["error" => "Aucun fichier ou erreur d'upload."]);
        exit;
    }

    $file = $_FILES['image'];
    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);

    // Générer un nom unique éviter les écrasements
    $filename = 'logo_' . time() . '_' . rand(1000, 9999) . '.' . $ext;
    $targetPath = $uploadsDir . '/' . $filename;

    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        // Construire l'URL absolue renvoyée au frontend
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
        $host = $_SERVER['HTTP_HOST'];
        $uri = rtrim(dirname($_SERVER['REQUEST_URI']), '/');
        $fileUrl = $protocol . "://" . $host . $uri . "/uploads/" . $filename;

        echo json_encode([
            "status" => "success",
            "url" => $fileUrl,
            "filename" => $filename
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Erreur lors du déplacement du fichier."]);
    }
    exit;
}

// 4. SUPPRIMER UNE IMAGE (POST)
// Appelée avant un nouvel upload pour ne pas accumuler de fichiers inutiles
if ($action === 'delete') {
    $filename = $_GET['file'] ?? '';
    // Sécurité basique pour empêcher de remonter l'arborescence (ex: ../../etc/passwd)
    if ($filename && preg_match('/^[a-zA-Z0-9_\-\.]+$/', $filename)) {
        $targetPath = $uploadsDir . '/' . $filename;
        if (file_exists($targetPath) && is_file($targetPath)) {
            unlink($targetPath);
            echo json_encode(["status" => "success", "message" => "Fichier supprimé"]);
            exit;
        }
    }
    http_response_code(404);
    echo json_encode(["error" => "Fichier introuvable ou invalide"]);
    exit;
}

// Action inconnue
http_response_code(404);
echo json_encode(["error" => "Action non reconnue."]);
