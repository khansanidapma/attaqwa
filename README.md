# Masjid At-Taqwa — Digital Display

Website digital signage masjid berbasis HTML, CSS, JavaScript, dan JSON, siap dipasang di GitHub Pages.

## Fitur
- Deteksi lokasi perangkat otomatis melalui Browser Geolocation API.
- Jadwal salat dinamis berdasarkan koordinat perangkat.
- Countdown ke salat berikutnya.
- Highlight salat berikutnya.
- Jam digital real-time.
- Tanggal Masehi + Hijriah.
- Matahari terbit/terbenam.
- Perkiraan arah kiblat dari koordinat.
- Fullscreen untuk TV/LED.
- Responsive/fluid untuk HP, tablet, laptop, dan TV.
- Konten pengumuman/pesan dapat diedit lewat `config.json`.
- Service worker dasar untuk cache aset.
- Fallback Bogor jika izin lokasi ditolak.

## Catatan penting
GitHub Pages harus dibuka melalui HTTPS agar browser dapat meminta izin lokasi dengan normal. Pengguna perlu menekan Allow/Izinkan Location pada perangkat yang menjalankan display.

Jadwal salat diambil dari AlAdhan API menggunakan koordinat lokasi. Parameter perhitungan ada di `config.json` dan dapat disesuaikan dengan standar yang dipakai DKM/masjid setempat.

## Deploy
1. Buat repository baru di GitHub.
2. Upload semua file dalam folder ini ke branch `main`.
3. Settings → Pages → Deploy from a branch → `main` → `/root`.
4. Buka URL GitHub Pages di TV/perangkat.
5. Izinkan Location.
6. Tekan tombol fullscreen.

## Kustomisasi
Edit `config.json` untuk:
- nama masjid
- pesan pengumuman
- pesan harian
- metode perhitungan
- lokasi fallback

Warna utama ada di bagian `:root` pada `style.css`.
