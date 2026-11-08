/*
 * Konfigurasi dokumen & isian per jenis surat.
 * Sama persis dengan larades-frontend.
 */
export const SURAT_CONFIG = {
  'Surat Keterangan Domisili': {
    hint: 'Menerangkan bahwa Anda benar bertempat tinggal di desa ini.',
    estimasi: '1-2 Hari Kerja',
    fields: [
      { name: 'kewarganegaraan', label: 'Kewarganegaraan' },
      {
        name: 'nama_rt',
        label: 'Nama Ketua RT',
        type: 'select',
        options: [
          'Agus Susilo',
          'Bambang Prayitno',
          'Sutrisno',
          'Prayitno',
          'Nur Salim',
        ],
      },
    ],
    files: [
      { name: 'ktp', label: 'Upload KTP' },
      { name: 'kk', label: 'Upload KK' },
    ],
  },

  'Surat Keterangan Usaha': {
    hint: 'Menerangkan bahwa Anda memiliki usaha yang berjalan di desa ini.',
    estimasi: '1-2 Hari Kerja',
    fields: [
      { name: 'nama_usaha', label: 'Nama Usaha' },
      { name: 'jenis_usaha', label: 'Jenis Usaha' },
      { name: 'alamat_usaha', label: 'Alamat Usaha' },
      { name: 'lama_usaha', label: 'Lama Usaha' },
    ],
    files: [
      { name: 'ktp', label: 'Upload KTP' },
      { name: 'kk', label: 'Upload KK' },
      { name: 'foto_usaha', label: 'Foto Usaha' },
    ],
  },

  'Surat Pengantar SKCK': {
    hint: 'Pengantar dari desa untuk mengurus SKCK di kepolisian.',
    estimasi: '2 Hari Kerja',
    fields: [
      { name: 'nama_ayah', label: 'Nama Ayah' },
      { name: 'nama_ibu', label: 'Nama Ibu' },
      { name: 'pekerjaan_ayah', label: 'Pekerjaan Ayah' },
      { name: 'pekerjaan_ibu', label: 'Pekerjaan Ibu' },
    ],
    files: [
      { name: 'ktp', label: 'Upload KTP' },
      { name: 'kk', label: 'Upload KK' },
    ],
  },

  'Surat Keterangan Tidak Mampu': {
    hint: 'Digunakan untuk bantuan sosial, beasiswa, atau layanan kesehatan.',
    estimasi: '1-2 Hari Kerja',
    fields: [
      { name: 'jumlah_tanggungan', label: 'Jumlah Tanggungan' },
      { name: 'pekerjaan', label: 'Pekerjaan Kepala Keluarga' },
    ],
    files: [
      { name: 'ktp', label: 'Upload KTP' },
      { name: 'kk', label: 'Upload KK' },
    ],
  },

  'Surat Keterangan Belum Menikah': {
    hint: 'Menerangkan status belum menikah.',
    estimasi: '1-2 Hari Kerja',
    fields: [
      {
        name: 'agama',
        label: 'Agama',
        type: 'select',
        options: [
          'Islam',
          'Kristen',
          'Katolik',
          'Hindu',
          'Buddha',
          'Konghucu',
        ],
      },
      { name: 'tempat_lahir', label: 'Tempat Lahir' },
      { name: 'tanggal_lahir', label: 'Tanggal Lahir', type: 'date' },
    ],
    files: [
      { name: 'ktp', label: 'Upload KTP' },
      { name: 'kk', label: 'Upload KK' },
    ],
  },

  'Surat Keterangan Kelahiran': {
    hint: 'Untuk pengurusan akta kelahiran.',
    estimasi: '2 Hari Kerja',
    fields: [
      { name: 'nama_bayi', label: 'Nama Bayi' },
      {
        name: 'jenis_kelamin',
        label: 'Jenis Kelamin',
        type: 'select',
        options: ['Laki-laki', 'Perempuan'],
      },
      { name: 'tanggal_lahir', label: 'Tanggal Lahir', type: 'date' },
      { name: 'nama_ayah', label: 'Nama Ayah' },
      { name: 'nama_ibu', label: 'Nama Ibu' },
    ],
    files: [
      { name: 'surat_lahir', label: 'Surat Kelahiran RS/Bidan' },
    ],
  },

  'Surat Keterangan Kematian': {
    hint: 'Untuk pengurusan akta kematian.',
    estimasi: '2 Hari Kerja',
    fields: [
      { name: 'nama_almarhum', label: 'Nama Almarhum' },
      { name: 'tanggal_meninggal', label: 'Tanggal Meninggal', type: 'date' },
      { name: 'penyebab', label: 'Penyebab Kematian' },
    ],
    files: [
      { name: 'surat_kematian', label: 'Surat Keterangan Kematian' },
    ],
  },

  'Surat Keterangan Penghasilan Orang Tua': {
    hint: 'Digunakan untuk sekolah atau beasiswa.',
    estimasi: '1-2 Hari Kerja',
    fields: [
      { name: 'nama_ayah', label: 'Nama Ayah' },
      { name: 'penghasilan_ayah', label: 'Penghasilan Ayah' },
      { name: 'nama_ibu', label: 'Nama Ibu' },
      { name: 'penghasilan_ibu', label: 'Penghasilan Ibu' },
    ],
    files: [
      { name: 'ktp_ayah', label: 'KTP Ayah' },
      { name: 'ktp_ibu', label: 'KTP Ibu' },
    ],
  },
};
