# Calcolatore Media LM-32 (Ingegneria Informatica)

Un'applicazione web moderna e leggera (PWA) progettata specificamente per gli studenti del corso di laurea magistrale in Ingegneria Informatica (LM-32) dell'Università degli Studi di Palermo.

## 🚀 Funzionalità Principali

- **Calcolo Media LM-32**: Implementa l'algoritmo ufficiale che esclude 6 CFU dell'esame con il voto più basso per il calcolo della media ponderata.
- **Base di Laurea**: Calcolo automatico della base di partenza in centodecimi (110).
- **Bonus Lodi**: Calcolo del bonus per le lodi (0.5 punti per lode, fino a un massimo di 3 punti).
- **Simulazione Voto Finale**: Include cursori per simulare i punti della tesi (0-11) e bonus extra (Erasmus, In Corso).
- **Simulazione Prossimo Esame**: Permette di vedere come un ipotetico voto influirebbe sulla media attuale.
- **Privacy Totale**: Tutti i dati sono salvati localmente nel browser (localStorage). Nessun dato viene inviato a server esterni.
- **Installabile (PWA)**: Può essere installata su Android e iOS come un'app nativa e funziona offline.

## 🛠️ Tecnologie Utilizzate

- **React 19** + **TypeScript**
- **Vite** 
- **Tailwind CSS** 
- **Lucide React** 
- **Vite PWA Plugin** 

## 📦 Installazione Locale

1. Clona il repository
2. Installa le dipendenze: `npm install`
3. Avvia in sviluppo: `npm run dev`
4. Crea la build di produzione: `npm run build`

## 📄 Licenza

Distribuito sotto licenza Apache-2.0.
