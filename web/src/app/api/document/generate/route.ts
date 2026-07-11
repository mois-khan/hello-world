import { NextResponse } from "next/server";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// ... (keep generateHTML exactly as it is)
function generateHTML(data: any) {
  const dateStr = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Land Title Document</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&family=Noto+Serif+Devanagari:wght@400;700&display=swap');
        
        body {
          margin: 0;
          padding: 0;
          font-family: 'Merriweather', serif;
          background: #fbfbf9;
          color: #111;
        }
        
        .page {
          width: 794px; /* A4 width */
          min-height: 1123px; /* A4 height */
          padding: 60px;
          box-sizing: border-box;
          position: relative;
          background: #fff;
          border: 4px solid #1a5632; /* Govt Green */
          outline: 2px solid #1a5632;
          outline-offset: -12px;
          margin: 0 auto;
        }

        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 100px;
          color: rgba(26, 86, 50, 0.05);
          font-weight: 700;
          white-space: nowrap;
          z-index: 1;
          pointer-events: none;
        }

        .header {
          text-align: center;
          border-bottom: 2px solid #1a5632;
          padding-bottom: 20px;
          margin-bottom: 30px;
          position: relative;
          z-index: 2;
        }

        .emblem {
          width: 80px;
          height: 100px;
          background: #eee; /* Placeholder for actual Ashoka emblem */
          margin: 0 auto 10px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          color: #666;
          border: 1px solid #ccc;
        }

        h1 {
          font-size: 26px;
          color: #1a5632;
          margin: 0 0 5px 0;
          text-transform: uppercase;
        }
        
        h2 {
          font-size: 18px;
          margin: 0;
          color: #444;
        }

        .meta-info {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          margin-bottom: 30px;
          font-family: monospace;
          z-index: 2;
          position: relative;
        }

        .content {
          font-size: 14px;
          line-height: 1.8;
          text-align: justify;
          z-index: 2;
          position: relative;
        }

        .property-schedule {
          border: 1px solid #1a5632;
          padding: 15px;
          margin: 20px 0;
          background: rgba(26, 86, 50, 0.02);
        }

        .property-schedule table {
          width: 100%;
          border-collapse: collapse;
        }

        .property-schedule td {
          padding: 8px;
          border-bottom: 1px dashed #ccc;
        }
        
        .property-schedule td:first-child {
          font-weight: bold;
          width: 40%;
        }

        .terms {
          margin: 30px 0;
          padding: 15px;
          background: #f9f9f9;
          border-left: 4px solid #1a5632;
          font-style: italic;
          white-space: pre-wrap;
        }

        .signatures {
          display: flex;
          justify-content: space-between;
          margin-top: 60px;
          z-index: 2;
          position: relative;
        }

        .signature-block {
          text-align: center;
          width: 250px;
        }

        .signature-img {
          width: 200px;
          height: 80px;
          object-fit: contain;
          border-bottom: 1px solid #000;
          margin-bottom: 10px;
        }

        .stamp {
          position: absolute;
          bottom: 50px;
          left: 50%;
          transform: translateX(-50%);
          width: 120px;
          height: 120px;
          border: 4px double #b91c1c;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #b91c1c;
          font-weight: bold;
          font-size: 14px;
          transform: translateX(-50%) rotate(-15deg);
          opacity: 0.8;
          z-index: 2;
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="watermark">BHURAKSHA REGISTRY</div>
        
        <div class="header">
          <div class="emblem">GOVT SEAL</div>
          <h1>DEED OF ${data.type === 'transfer' ? 'CONVEYANCE (SALE)' : 'INITIAL GRANT'}</h1>
          <h2>STATE OF TELANGANA, INDIA</h2>
          <p style="margin:5px 0 0; font-size:12px; color:#666;">Department of Revenue, Registration and Stamps</p>
        </div>

        <div class="meta-info">
          <div><strong>Document ID:</strong> BR-DOC-${Date.now().toString().slice(-6)}</div>
          <div><strong>Date of Execution:</strong> ${dateStr}</div>
        </div>

        <div class="content">
          <p>
            This Deed of ${data.type === 'transfer' ? 'Sale' : 'Registration'} is made and executed on this <strong>${dateStr}</strong>, 
            under the jurisdiction of the digital blockchain registry of BhuRaksha.
          </p>

          ${data.type === 'transfer' ? `
            <p>
              <strong>BETWEEN</strong><br/>
              <strong>${data.sellerName}</strong>, hereinafter referred to as the "VENDOR" (which expression shall unless repugnant to the context or meaning thereof mean and include his/her heirs, executors, administrators and assigns) of the ONE PART.
            </p>
            <p>
              <strong>AND</strong><br/>
              <strong>${data.buyerName}</strong>, hereinafter referred to as the "VENDEE" (which expression shall unless repugnant to the context or meaning thereof mean and include his/her heirs, executors, administrators and assigns) of the OTHER PART.
            </p>
          ` : `
            <p>
              <strong>BY</strong><br/>
              <strong>THE STATE (Registrar)</strong>, hereinafter granting the title.
            </p>
            <p>
              <strong>IN FAVOUR OF</strong><br/>
              <strong>${data.ownerName}</strong>, hereinafter referred to as the "OWNER" of the property described in the schedule below.
            </p>
          `}

          <div class="property-schedule">
            <h3 style="margin-top:0; font-size:16px; border-bottom:1px solid #1a5632; padding-bottom:5px;">SCHEDULE OF PROPERTY</h3>
            <table>
              <tr>
                <td>Parcel ID (Blockchain)</td>
                <td>#${data.parcelId || 'TBD'}</td>
              </tr>
              <tr>
                <td>Survey Number</td>
                <td>${data.surveyNumber}</td>
              </tr>
              <tr>
                <td>District/Village</td>
                <td>${data.district}</td>
              </tr>
              <tr>
                <td>Total Area</td>
                <td>${data.area} sq.ft</td>
              </tr>
            </table>
          </div>

          <div class="terms">
            ${data.agreementText || 'The property is transferred with all absolute rights of ownership, without any encumbrances or pending disputes.'}
          </div>

          <p style="text-align:center; font-weight:bold; margin-top:40px;">
            IN WITNESS WHEREOF the parties herein have executed this Deed on the day, month and year first above written.
          </p>
        </div>

        <div class="signatures">
          <div class="signature-block">
            ${data.sellerSignature ? `<img src="${data.sellerSignature}" class="signature-img" />` : '<div class="signature-img"></div>'}
            <div><strong>${data.type === 'transfer' ? data.sellerName : 'Registrar'}</strong></div>
            <div style="font-size:12px; color:#666;">${data.type === 'transfer' ? 'Vendor / Seller' : 'Authorized Signatory'}</div>
          </div>
          
          <div class="signature-block">
            ${data.buyerSignature ? `<img src="${data.buyerSignature}" class="signature-img" />` : '<div class="signature-img"></div>'}
            <div><strong>${data.type === 'transfer' ? data.buyerName : data.ownerName}</strong></div>
            <div style="font-size:12px; color:#666;">${data.type === 'transfer' ? 'Vendee / Buyer' : 'Owner'}</div>
          </div>
        </div>

        <div class="stamp">
          REGISTERED<br/><br/>
          BHURAKSHA
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function POST(req: Request) {
  try {
    let data = await req.json();

    const storageDir = '/tmp';
    if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });

    if (data.action === "sign-buyer") {
      const dataFile = path.join(storageDir, `doc-data-${data.parcelId}.json`);
      if (fs.existsSync(dataFile)) {
        const savedData = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
        data = { ...savedData, buyerSignature: data.buyerSignature };
      }
    } else if (data.type === 'transfer') {
      fs.writeFileSync(path.join(storageDir, `doc-data-${data.parcelId}.json`), JSON.stringify(data));
    }

    // Launch puppeteer with Vercel support
    const isLocal = process.env.NODE_ENV === "development";
    
    const chromiumArgs = await Promise.resolve(chromium.args);
    
    const browser = await puppeteer.launch({
      args: isLocal ? puppeteer.defaultArgs() : (chromiumArgs as any),
      executablePath: await chromium.executablePath(),
      headless: true,
    });
    
    const page = await browser.newPage();
    const htmlContent = generateHTML(data);
    
    await page.setContent(htmlContent, { waitUntil: "domcontentloaded" });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0px", right: "0px", bottom: "0px", left: "0px" }
    });

    await browser.close();

    // Generate a hash to act as the documentHash
    const hash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
    const documentHash = "0x" + hash;

    // Convert Buffer to Base64 to send it back to client
    const base64Pdf = Buffer.from(pdfBuffer).toString('base64');

    return NextResponse.json({ 
      success: true, 
      documentHash,
      pdfBase64: base64Pdf
    });
    
  } catch (error: unknown) {
    console.error("PDF Generation Error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF document" },
      { status: 500 }
    );
  }
}
