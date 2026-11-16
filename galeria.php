<?php
require_once __DIR__ . '/../config/database.php';
$token = trim($_GET['token'] ?? '');
if (!preg_match('/^[a-f0-9]{48}$/',$token)) { http_response_code(404); exit('Galería no encontrada.'); }
$stmt=$pdo->prepare('SELECT id,client_name,created_at FROM albums WHERE token=?');$stmt->execute([$token]);$album=$stmt->fetch();
if(!$album){http_response_code(404);exit('Galería no encontrada.');}
$stmt=$pdo->prepare('SELECT id,original_name,mime_type,file_size FROM photos WHERE album_id=? ORDER BY id DESC');$stmt->execute([$album['id']]);$photos=$stmt->fetchAll();
?>
<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Galería de <?=htmlspecialchars($album['client_name'])?> | LALO.COM</title><link rel="stylesheet" href="../assets/css/style.css"></head><body>
<header class="gallery-head"><a class="brand" href="../index.php">LALO<span>.</span>COM</a><p class="eyebrow">GALERÍA PRIVADA</p><h1><?=htmlspecialchars($album['client_name'])?></h1><p>Explora tus fotografías y descarga los archivos originales.</p></header>
<main class="photo-grid"><?php foreach($photos as $photo):?><article class="photo-card"><a href="ver.php?id=<?=$photo['id']?>&token=<?=htmlspecialchars($token)?>" target="_blank" rel="noopener" style="padding:0"><img loading="lazy" src="ver.php?id=<?=$photo['id']?>&token=<?=htmlspecialchars($token)?>" alt="<?=htmlspecialchars($photo['original_name'])?>"></a><a href="descargar.php?id=<?=$photo['id']?>&token=<?=htmlspecialchars($token)?>">Descargar original ↓</a></article><?php endforeach;?></main>
<?php if(!$photos):?><p class="empty">Esta galería todavía no tiene fotografías.</p><?php endif;?>
<footer class="site-footer"><a class="brand" href="../index.php">LALO<span>.</span>COM</a><small>Las descargas conservan el archivo original subido.</small></footer></body></html>