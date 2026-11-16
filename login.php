<?php
require_once __DIR__ . '/../config/auth.php';
if (!empty($_SESSION['admin_id'])) { header('Location: dashboard.php'); exit; }
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $email = filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL);
    $password = $_POST['password'] ?? '';
    $stmt = $pdo->prepare('SELECT id,email,password_hash FROM admins WHERE email=? LIMIT 1');
    $stmt->execute([$email ?: '']);
    $admin = $stmt->fetch();
    if ($admin && password_verify($password, $admin['password_hash'])) {
        session_regenerate_id(true);
        $_SESSION['admin_id'] = (int)$admin['id'];
        $_SESSION['admin_email'] = $admin['email'];
        header('Location: dashboard.php'); exit;
    }
    $error = 'Correo o contraseña incorrectos.';
}
?>
<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Acceso administrador | LALO.COM</title><link rel="stylesheet" href="../assets/css/style.css"></head>
<body class="panel-body"><div class="login-box"><a class="brand" href="../index.php">LALO<span>.</span>COM</a><section class="panel-card" style="margin-top:25px"><p class="eyebrow">ZONA PRIVADA</p><h1>Bienvenido.</h1><p class="help">Inicia sesión para administrar tus galerías.</p><?php if($error):?><div class="notice error"><?=htmlspecialchars($error)?></div><?php endif;?>
<form method="post"><input type="hidden" name="csrf" value="<?=htmlspecialchars(csrf_token())?>"><label class="form-group">Correo electrónico<input class="field" type="email" name="email" required autocomplete="username"></label><label class="form-group">Contraseña<input class="field" type="password" name="password" required autocomplete="current-password"></label><button class="button button-dark" type="submit">Iniciar sesión →</button></form></section><a class="help" href="../index.php">← Volver al sitio</a></div></body></html>