exports.getHealthRecommendations = (req, res) => {
    const { penyakit } = req.body; 

    const recommendations = {
        flu: "Pastikan untuk beristirahat yang cukup, minum banyak cairan, dan konsultasikan dengan dokter jika gejala berlanjut.",
        demam_berdarah: "Segera cari perawatan medis, jaga hidrasi, dan hindari obat penghilang rasa sakit yang mengandung aspirin.",
        ispa: "Hindari paparan asap dan polusi, gunakan masker jika perlu, dan konsultasikan dengan dokter jika gejala berlanjut.",
        asma: "Hindari pemicu asma, gunakan inhaler sesuai petunjuk, dan konsultasikan dengan dokter untuk pengobatan yang tepat.",
        alergi: "Hindari alergen yang diketahui, gunakan antihistamin jika perlu, dan konsultasikan dengan dokter untuk pengobatan lebih lanjut.",
        penyakit_kulit: "Jaga kebersihan kulit, hindari produk yang dapat menyebabkan iritasi, dan konsultasikan dengan dokter untuk perawatan yang tepat.",
        tifus: "Segera cari perawatan medis, jaga hidrasi, dan ikuti saran dokter untuk pengobatan.",
        pneumonia: "Segera cari perawatan medis, jaga hidrasi, dan ikuti saran dokter untuk pengobatan.",
        diare: "Pastikan untuk tetap terhidrasi, hindari makanan berat, dan konsultasikan dengan dokter jika gejala berlanjut."
    };

    if (!penyakit || !Array.isArray(penyakit)) {
        return res.status(400).json({ message: "Input tidak valid. Harap kirimkan array penyakit." });
    }

    const recommendationsList = penyakit.map(p => {
        return {
            penyakit: p,
            rekomendasi: recommendations[p] || "Rekomendasi tidak ditemukan untuk penyakit ini."
        };
    });

    return res.json({
        rekomendasi: recommendationsList
    });
};