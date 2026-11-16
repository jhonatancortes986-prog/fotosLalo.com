<?php
// Ejecuta una sola vez después de importar schema.sql. Luego elimina este archivo del servidor.
require_once __DIR__ . '/config/database.php';
$message='';
if($_SERVER['REQUEST_METHOD']==='POST'){
  $email=filter_var(trim($_POST['email']??''),FILTER_VALIDATE_EMAIL);
  $password=$_POST['password']??'';
  if(!$email || strlen($password)<12){$message='Escribe un correo válido y una contraseña de al menos 12 caracteres.';}
  else{
    $count=(int)$pdo->query('SELECT COUNT(*) FROM admins')->fetchColumn();
    if($count>0){$message='Ya existe un administrador. Elimina setup.php del servidor.';}
    else{$stmt=$pdo->prepare('INSERT INTO admins(email,password_hash,created_at) VALUES(?,?,NOW())');$stmt->execute([$email,password_hash($password,PASSWORD_DEFAULT)]);$message='Administrador creado. Elimina setup.php y entra en admin/login.php.';}
  }
}
?>
<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Configuración inicial</title><link rel="stylesheet" href="assets/css/style.css"></head><body class="panel-body"><main class="login-box"><section class="panel-card"><h1>Crear administrador</h1><?php if($message):?><p class="notice"><?=htmlspecialchars($message)?></p><?php endif;?><form method="post"><label class="form-group">Correo<input class="field" type="email" name="email" required></label><label class="form-group">Contraseña (mínimo 12 caracteres)<input class="field" type="password" name="password" minlength="12" required></label><button class="button button-dark">Crear administrador</button></form></section></main></body></html>