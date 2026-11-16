<?php
require_once __DIR__ . '/../config/auth.php'; require_admin();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { header('Location: dashboard.php'); exit; }
verify_csrf();
$client = trim($_POST['client_name'] ?? '');
$email = trim($_POST['client_email'] ?? '');
if ($client === '' || mb_strlen($client) > 120 || ($email !== '' && !filter_var($email,FILTER_VALIDATE_EMAIL))) exit('Datos del cliente no válidos.');
if (empty($_FILES['photos']) || !is_array($_FILES['photos']['name'])) exit('Selecciona al menos una fotografía.');
$storage = dirname(__DIR__) . '/storage/originals';
if (!is_dir($storage) && !mkdir($storage,0750,true)) exit('No se pudo crear el almacenamiento.');
$allowed = ['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'];
$finfo = new finfo(FILEINFO_MIME_TYPE);
$files = $_FILES['photos']; $valid = [];
foreach ($files['name'] as $i=>$originalName) {
    if ($files['error'][$i] === UPLOAD_ERR_NO_FILE) continue;
    if ($files['error'][$i] !== UPLOAD_ERR_OK) exit('Hubo un error al subir uno de los archivos.');
    if ($files['size'][$i] > 50*1024*1024) exit('Cada fotografía debe pesar máximo 50 MB.');
    $tmp = $files['tmp_name'][$i]; $mime = $finfo->file($tmp);
    if (!isset($allowed[$mime]) || @getimagesize($tmp) === false) exit('Formato no permitido. Usa JPG, PNG o WebP.');
    $valid[] = ['tmp'=>$tmp,'mime'=>$mime,'ext'=>$allowed[$mime],'name'=>basename((string)$originalName)];
}
if (!$valid) exit('No se recibieron fotografías válidas.');
$token = bin2hex(random_bytes(24));
try {
    $pdo->beginTransaction();
    $stmt=$pdo->prepare('INSERT INTO albums(client_name,client_email,token,created_at) VALUES(?,?,?,NOW())');
    $stmt->execute([$client,$email ?: null,$token]); $albumId=(int)$pdo->lastInsertId();
    $insert=$pdo->prepare('INSERT INTO photos(album_id,stored_name,original_name,mime_type,file_size,created_at) VALUES(?,?,?,?,?,NOW())');
    $moved=[];
    foreach($valid as $f) {
        $stored=bin2hex(random_bytes(20)).'.'.$f['ext'];
        if(!move_uploaded_file($f['tmp'],$storage.'/'.$stored)) throw new RuntimeException('No se pudo guardar un archivo.');
        $moved[]=$storage.'/'.$stored;
        $insert->execute([$albumId,$stored,$f['name'],$f['mime'],filesize($storage.'/'.$stored)]);
    }
    $pdo->commit();
} catch(Throwable $e) {
    if($pdo->inTransaction()) $pdo->rollBack();
    foreach(($moved ?? []) as $path) if(is_file($path)) unlink($path);
    http_response_code(500); exit('No se pudo completar la carga. Revisa permisos y configuración del servidor.');
}
$base = rtrim(dirname(dirname($_SERVER['SCRIPT_NAME'])), '/');
$link = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https' : 'http').'://'.$_SERVER['HTTP_HOST'].$base.'/clientes/galeria.php?token='.$token;
?>
<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Galería creada | LALO.COM</title><link rel="stylesheet" href="../assets/css/style.css"></head><body class="panel-body"><main class="panel-wrap"><section class="panel-card"><p class="eyebrow">PROCESO COMPLETADO</p><h1>Galería creada.</h1><p>Se creó la galería para <strong><?=htmlspecialchars($client)?></strong> y se guardaron <?=count($valid)?> fotografías originales.</p><p class="help">Comparte este enlace privado únicamente con tu cliente:</p><p class="album-url"><a href="<?=htmlspecialchars($link)?>" target="_blank" rel="noopener"><?=htmlspecialchars($link)?></a></p><button class="button button-dark" type="button" onclick="navigator.clipboard.writeText(<?=json_encode($link)?>).then(()=>alert('Enlace copiado'))">Copiar enlace privado</button><p style="margin-top:20px"><a href="dashboard.php">← Volver al panel</a></p></section></main></body></html>