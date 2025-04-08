<template>
    <div class="container">
      <h1>DUB13 – Analyse de rentabilité</h1>
  
      <form @submit.prevent="lancerAnalyse" enctype="multipart/form-data">
        <div class="input-group">
          <label>Fichier fournisseur (.csv ou .xlsx)</label>
          <input type="file" @change="handleFournisseurUpload" required />
        </div>
  
        <div class="input-group">
          <label>Dossier Keepa (.zip ou .rar)</label>
          <input type="file" @change="handleKeepaUpload" required />
        </div>
  
        <div class="input-group">
          <label><input type="checkbox" v-model="form.ht_mode" /> Prix fournisseur HT</label>
        </div>
  
        <div class="input-group">
          <label>Taux de TVA (%)</label>
          <select v-model="form.tva">
            <option>20</option>
            <option>21</option>
            <option>12.30</option>
            <option>10</option>
            <option>5.5</option>
          </select>
        </div>
  
        <div class="input-group">
          <label>Marge brute minimale (€)</label>
          <input type="number" step="0.01" v-model="form.marge_min" />
        </div>
  
        <div class="input-group">
          <label>ROI minimal (%)</label>
          <input type="number" step="1" v-model="form.roi_min" />
        </div>
  
        <div class="input-group">
          <label>Ventes estimées minimales (30j)</label>
          <input type="number" step="1" v-model="form.ventes_min" />
        </div>
  
        <button type="submit">Lancer l’analyse</button>
      </form>
  
      <div v-if="resultats.length">
        <h2>Résultats</h2>
        <table>
          <thead>
            <tr>
              <th v-for="(col, index) in colonnes" :key="index">{{ col }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(ligne, index) in resultats" :key="index">
              <td v-for="(val, key) in ligne" :key="key">{{ val }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        fournisseurFile: null,
        keepaFile: null,
        resultats: [],
        colonnes: [],
        form: {
          ht_mode: false,
          tva: 20,
          marge_min: 0,
          roi_min: 0,
          ventes_min: 0,
        },
      };
    },
    methods: {
      handleFournisseurUpload(e) {
        this.fournisseurFile = e.target.files[0];
      },
      handleKeepaUpload(e) {
        this.keepaFile = e.target.files[0];
      },
      async lancerAnalyse() {
        const formData = new FormData();
        formData.append("fournisseur", this.fournisseurFile);
        formData.append("keepa_zip", this.keepaFile);
        formData.append("ht_mode", this.form.ht_mode);
        formData.append("tva", this.form.tva);
        formData.append("marge_min", this.form.marge_min);
        formData.append("roi_min", this.form.roi_min);
        formData.append("ventes_min", this.form.ventes_min);
  
        try {
          const response = await fetch("http://127.0.0.1:8000/analyse", {
            method: "POST",
            body: formData,
          });
  
          const data = await response.json();
          this.resultats = data.resultats;
          this.colonnes = this.resultats.length ? Object.keys(this.resultats[0]) : [];
  
        } catch (err) {
          alert("Erreur lors de l’analyse : " + err.message);
        }
      },
    },
  };
  </script>
  
  <style scoped>
  .container {
    max-width: 900px;
    margin: auto;
    padding: 20px;
    font-family: Arial;
  }
  .input-group {
    margin-bottom: 10px;
  }
  input,
  select {
    padding: 6px;
    width: 100%;
    margin-top: 4px;
  }
  button {
    background: #4CAF50;
    color: white;
    padding: 10px 18px;
    border: none;
    cursor: pointer;
  }
  table {
    margin-top: 30px;
    width: 100%;
    border-collapse: collapse;
  }
  th,
  td {
    border: 1px solid #ccc;
    padding: 6px;
  }
  th {
    background: #f2f2f2;
  }
  </style>
  