const input = document.getElementById("file");
const btn = document.getElementById("convert");
const log = document.getElementById("log");

let fileBuffer = null;

input.addEventListener("change", (ev) => {
  const f = ev.target.files && ev.target.files[0];
  if (!f) {
    btn.disabled = true;
    return;
  }
  btn.disabled = false;
  const reader = new FileReader();
  reader.onload = (e) => {
    fileBuffer = e.target.result;
    log.innerText = `Arquivo carregado: ${f.name} (${f.size} bytes)`;
  };
  reader.readAsArrayBuffer(f);
});

btn.addEventListener("click", async () => {
  if (!fileBuffer) return;
  btn.disabled = true;
  log.innerText = "Processando PDF... (pode demorar dependendo do tamanho)";

  try {
    const pdfjsLib = window["pdfjs-dist/build/pdf"] || window.pdfjsLib;
    // se necessário, configure worker (CDN)
    if (pdfjsLib.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
    }

    const pdf = await pdfjsLib.getDocument({ data: fileBuffer }).promise;
    const numPages = pdf.numPages;
    log.innerText = `PDF carregado — ${numPages} páginas. Extraindo texto...`;

    // Vamos criar uma sheet por página (ou uma linha por página)
    const test = [];
    let motorista ;
    const date = new Date();
    const dia = date.getDate()
    const mes = date.getMonth() + 1

    for (let p = 1; p <= numPages; p++) {
      const page = await pdf.getPage(p);
      const txtContent = await page.getTextContent();

      // txtContent.items é um array de objetos com 'str' (string) e 'transform' (pos)
      // Vamos concatenar as strings (mantendo alguma ordem).
      const strings = txtContent.items.map((i) => {
        const stri = i.str;
        return stri;
      });

      motorista = strings.find(i => i.includes("EDUARDO") || i.includes("FELIPE") || i.includes("HENRIQUE"))

      for (teste = 0; teste < strings.length; teste++) {
        if (
          strings[teste].includes("Rua") ||
          strings[teste].includes("Avenida") ||
          strings[teste].includes("Av") ||
          strings[teste].includes("Travessa") ||
          strings[teste].includes("Trv") ||
          strings[teste].includes("Qdr") ||
          strings[teste].includes("quadra") ||
          strings[teste].includes("Alm") ||
          strings[teste].includes("Alameda") ||
          strings[teste].includes("Vila")
        ) {
          test.push(strings[teste]);
        }
      }
    }
    console.log(test);

    const workbook = XLSX.utils.book_new();
    const data = [["Address Line 1", "Address Line 2", "city", "state", "postalcode"], ...test.map((item) => [item, item, "Fortaleza", "CE", ""])];
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, ws, "Endereços");
    // Criar worksheet simples: uma célula A1 com o texto da página

    // Gerar arquivo XLSX
    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${motorista} ${dia}-${mes}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    log.innerText = "Concluído! Baixando saída.xlsx";
  } catch (err) {
    console.error(err);
    log.innerText = "Erro: " + (err && err.message ? err.message : err);
  } finally {
    btn.disabled = false;
  }
});
