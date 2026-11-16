<?php
require_once __DIR__ . '/config/database.php';
$albumCount = (int)$pdo->query("SELECT COUNT(*) FROM albums")->fetchColumn();
?>
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>LALO.COM | Fotografía</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
<header class="site-header">
  <a class="brand" href="index.php">LALO<span>.</span>COM</a>
  <nav><a href="#experiencia">Experiencia</a><a href="#acceso">Clientes</a><a class="nav-cta" href="admin/login.php">Administración</a></nav>
</header>
<main>
  <section class="hero">
    <div class="hero-copy">
      <p class="eyebrow">FOTOGRAFÍA · HISTORIAS · RECUERDOS</p>
      <h1>Momentos que<br><em>merecen quedarse.</em></h1>
      <p class="hero-text">Una galería privada para descubrir, revivir y descargar tus fotografías en su calidad original.</p>
      <a class="button button-light" href="#acceso">Ver mi galería <span>↗</span></a>
    </div>
    <div class="hero-image" role="img" aria-label="Fotografía artística de paisaje"></div>
    <div class="hero-index">01 / LALO PHOTOGRAPHY</div>
  </section>
  <section class="intro section" id="experiencia">
    <p class="eyebrow">UNA EXPERIENCIA PERSONAL</p>
    <h2>Tus recuerdos, cuidados<br>hasta el último detalle.</h2>
    <p>Accede a tu colección privada desde cualquier dispositivo. Explora cada imagen y descarga los archivos originales sin compresión adicional de nuestra plataforma.</p>
  </section>
  <section class="access section" id="acceso">
    <div><p class="eyebrow">ACCESO PARA CLIENTES</p><h2>Tu galería te espera.</h2><p>Usa el enlace privado que te compartió LALO.COM para abrir tu álbum.</p></div>
    <form class="access-form" action="clientes/galeria.php" method="get">
      <label for="token">Código o enlace de tu galería</label>
      <input id="token" name="token" required placeholder="Pega aquí tu código privado">
      <button class="button button-dark" type="submit">Entrar a mi galería <span>→</span></button>
    </form>
  </section>
</main>
<footer class="site-footer"><a class="brand" href="index.php">LALO<span>.</span>COM</a><p>Fotografía para conservar lo que importa.</p><small>© <?= date('Y') ?> LALO.COM · Todos los derechos reservados</small></footer>
<script src="assets/js/main.js" defer></script>
</body></html>