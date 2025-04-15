<template>
  <div class="min-h-screen bg-gray-900 text-white font-sans px-4 py-8">
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold text-center mb-8">Analyse Rentabilité Amazon</h1>

      <!-- FORMULAIRE -->
      <form @submit.prevent="submitForm" class="bg-gray-800 p-6 rounded-lg shadow-md space-y-6">
        <div>
          <label class="block font-medium mb-1">Fichier fournisseur (.csv ou .xlsx)</label>
          <input type="file" @change="onFournisseurUpload" class="w-full bg-gray-700 p-2 rounded" />
        </div>
        <div>
          <label class="block font-medium mb-1">Fichier Keepa (.zip ou .rar)</label>
          <input type="file" @change="onKeepaUpload" class="w-full bg-gray-700 p-2 rounded" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block font-medium mb-1">Taux de TVA (%)</label>
            <select v-model="form.tva" class="w-full bg-gray-700 p-2 rounded">
              <option value="20">20%</option>
              <option value="21">21%</option>
              <option value="12.3">12.3%</option>
              <option value="10">10%</option>
              <option value="5.5">5.5%</option>
            </select>
          </div>
          <div class="flex items-center mt-6">
            <input type="checkbox" v-model="form.ht_mode" class="mr-2" />
            <label>Prix fournisseur en HT</label>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block font-medium mb-1">Marge minimale (€)</label>
            <input type="number" v-model="form.marge_min" class="w-full bg-gray-700 p-2 rounded" />
          </div>
          <div>
            <label class="block font-medium mb-1">ROI minimum (%)</label>
            <input type="number" v-model="form.roi_min" class="w-full bg-gray-700 p-2 rounded" />
          </div>
          <div>
            <label class="block font-medium mb-1">Ventes min (30j)</label>
            <input type="number" v-model="form.ventes_min" class="w-full bg-gray-700 p-2 rounded" />
          </div>
        </div>

        <div class="flex justify-between items-center">
          <button type="submit" class="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded">
            Lancer l’analyse
          </button>
          <button v-if="results.length" @click="exportCSV" type="button" class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded">
            Exporter CSV
          </button>
        </div>
      </form>

      <!-- TABLEAU -->
      <div v-if="results.length" class="mt-10">
        <h2 class="text-xl font-semibold mb-4">Résultats</h2>

        <div v-for="(group, asin) in groupedByASIN" :key="asin" class="mb-6 border border-gray-700 rounded overflow-hidden">
          <div class="bg-gray-700 px-4 py-2 cursor-pointer flex justify-between items-center" @click="toggleGroup(asin)">
            <span class="font-semibold">ASIN : {{ asin }}</span>
            <span>{{ collapsedGroups[asin] ? '▶' : '▼' }}</span>
          </div>

          <table v-if="!collapsedGroups[asin]" class="w-full text-sm bg-gray-800">
            <thead class="bg-gray-700">
              <tr>
                <th v-for="col in columns" :key="col" class="p-2 text-left">{{ col }}</th>
                <th class="p-2 text-left">Graph Keepa</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, idx) in group"
                :key="idx"
                :class="{
                  'bg-green-800': parseFloat(row['ROI (%)']) > 60,
                  'border-t border-gray-600': idx > 0
                }"
              >
                <td v-for="col in columns" :key="col" class="p-2 border-b border-gray-700">
                  {{ row[col] }}
                </td>
                <td class="p-2 border-b border-gray-700">
                  <img
                    :src="`https://graph.keepa.com/pricehistory.png?asin=${row.ASIN}&domain=fr&salesrank=1&range=365`"
                    alt="Graph Keepa"
                    class="w-44 cursor-zoom-in hover:scale-105 transition"
                    @click="openModal(row.ASIN)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODAL -->
      <div v-if="zoomedASIN" class="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center">
        <div class="bg-gray-900 p-4 rounded shadow-lg max-w-5xl">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold">Graphique Keepa - {{ zoomedASIN }}</h3>
            <button @click="zoomedASIN = null" class="text-red-400 hover:underline">Fermer</button>
          </div>
          <img :src="`https://graph.keepa.com/pricehistory.png?asin=${zoomedASIN}&domain=fr&salesrank=1&range=365`" class="w-full max-h-[80vh] object-contain" />
        </div>
      </div>

      <!-- LOADER -->
      <div v-if="loading" class="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center">
        <div class="text-center">
          <div class="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-16 w-16 mb-4 mx-auto animate-spin"></div>
          <p class="text-white font-semibold">Analyse en cours... Veuillez patienter</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      form: {
        tva: 20,
        ht_mode: false,
        marge_min: 0,
        roi_min: 0,
        ventes_min: 0,
      },
      fournisseurFile: null,
      keepaFile: null,
      results: [],
      collapsedGroups: {},
      zoomedASIN: null,
      loading: false,
    };
  },
  computed: {
    columns() {
      return this.results.length
        ? Object.keys(this.results[0]).filter(col => col !== 'ASIN')
        : [];
    },
    groupedByASIN() {
      const grouped = {};
      for (const row of this.results) {
        const asin = row.ASIN;
        if (!grouped[asin]) grouped[asin] = [];
        grouped[asin].push(row);
      }
      return grouped;
    },
  },
  methods: {
    onFournisseurUpload(e) {
      this.fournisseurFile = e.target.files[0];
    },
    onKeepaUpload(e) {
      this.keepaFile = e.target.files[0];
    },
    toggleGroup(asin) {
      this.$set(this.collapsedGroups, asin, !this.collapsedGroups[asin]);
    },
    openModal(asin) {
      this.zoomedASIN = asin;
    },
    async submitForm() {
      this.loading = true;
      const formData = new FormData();
      formData.append('fournisseur', this.fournisseurFile);
      formData.append('keepa_zip', this.keepaFile);
      formData.append('ht_mode', this.form.ht_mode);
      formData.append('tva', this.form.tva);
      formData.append('marge_min', this.form.marge_min);
      formData.append('roi_min', this.form.roi_min);
      formData.append('ventes_min', this.form.ventes_min);

      try {
        const res = await fetch('http://127.0.0.1:8000/analyse', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        this.results = data.resultats.map(row => ({
          ...row,
          'Marge Brute (€)': parseFloat(row['Marge Brute (€)']).toFixed(2),
        }));
      } catch (err) {
        alert('Erreur lors de l’analyse : ' + err.message);
      } finally {
        this.loading = false;
      }
    },
    exportCSV() {
      const csvRows = [];
      const allCols = ['ASIN', ...this.columns];
      csvRows.push(allCols.join(','));
      for (const row of this.results) {
        const values = allCols.map(col => `"${String(row[col] || '').replace(/"/g, '""')}"`);
        csvRows.push(values.join(','));
      }
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'analyse_rentabilite.csv';
      a.click();
      URL.revokeObjectURL(url);
    },
  },
};
</script>

<style>
body {
  margin: 0;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loader {
  border-top-color: #4ade80;
  animation: spin 1s linear infinite;
}
</style>
