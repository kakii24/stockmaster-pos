use crate::hardware::escpos::EscPosBuilder;
use crate::models::Sale;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct PrintReceiptResult {
    pub success: bool,
    pub raw_hex: String,
    pub message: String,
}

#[tauri::command]
pub fn print_receipt_escpos(
    sale: Sale,
    is_80mm: bool,
    open_drawer: bool,
) -> Result<PrintReceiptResult, String> {
    let mut builder = EscPosBuilder::new(is_80mm);

    if open_drawer {
        builder.open_cash_drawer();
    }

    // Header
    builder
        .align_center()
        .bold(true)
        .text_size(true, true)
        .line("STOCKMASTER POS")
        .bold(false)
        .text_size(false, false)
        .line("Commerce de Gros & Detail")
        .line("12 Boulevard des Martyrs, Alger")
        .line("Tel: +213 21 00 00 00")
        .line("NIF: 099816001234567")
        .separator();

    // Ticket info
    builder
        .align_left()
        .row("Ticket N°:", &sale.invoice_number)
        .row("Date:", &sale.created_at)
        .row(
            "Client:",
            sale.customer_name.as_deref().unwrap_or("Client Comptoir"),
        )
        .row("Mode Vente:", if sale.sale_type == "wholesale" { "GROS" } else { "DETAIL" })
        .separator();

    // Table Header
    builder.bold(true);
    if is_80mm {
        builder.row("Designation     Qte x P.U", "Total");
    } else {
        builder.row("Article   Qte x Prix", "Total");
    }
    builder.bold(false).separator();

    // Items
    for item in &sale.items {
        builder.bold(true).line(&item.product_name).bold(false);
        let qty_price = format!("{:.1} x {:.2}", item.quantity, item.unit_price_ht);
        let total_line = format!("{:.2}", item.total_ttc);
        builder.row(&format!("  {}", qty_price), &total_line);
    }

    builder.double_separator();

    // Totals
    builder.row("Total HT:", &format!("{:.2}", sale.subtotal_ht));
    if sale.discount_amount > 0.0 {
        builder.row("Remise:", &format!("-{:.2}", sale.discount_amount));
    }
    builder.row("TVA:", &format!("{:.2}", sale.tax_tva));
    if sale.timbre_fiscal > 0.0 {
        builder.row("Timbre Fiscal (1%):", &format!("{:.2}", sale.timbre_fiscal));
    }

    builder
        .bold(true)
        .text_size(true, false)
        .row("NET A PAYER:", &format!("{:.2}", sale.total_ttc))
        .text_size(false, false)
        .bold(false)
        .separator();

    // Payment details
    builder.row(
        "Mode Paiement:",
        match sale.payment_method.as_str() {
            "cash" => "Especes",
            "card" => "Carte Bancaire / CIB",
            "check" => "Cheque",
            "credit" => "A Credit",
            _ => "Mixte",
        },
    );
    builder.row("Recu:", &format!("{:.2}", sale.paid_amount));
    if sale.change_amount > 0.0 {
        builder.row("Rendu Monnaie:", &format!("{:.2}", sale.change_amount));
    }

    // Barcode & Footer
    builder
        .separator()
        .barcode_128(&sale.invoice_number)
        .align_center()
        .feed(1)
        .line("Merci de votre visite !")
        .line("Les retours sont acceptes sous 48h")
        .line("avec ce ticket de caisse.")
        .cut_paper();

    let raw_bytes = builder.build();
    let raw_hex = raw_bytes.iter().map(|b| format!("{:02X}", b)).collect::<Vec<_>>().join(" ");

    Ok(PrintReceiptResult {
        success: true,
        raw_hex,
        message: "Ticket généré avec succès".to_string(),
    })
}

#[tauri::command]
pub fn kick_cash_drawer() -> Result<bool, String> {
    let mut builder = EscPosBuilder::new(true);
    builder.open_cash_drawer();
    // In production with a physical printer connected to USB/Network, the bytes are pushed to the device
    Ok(true)
}
