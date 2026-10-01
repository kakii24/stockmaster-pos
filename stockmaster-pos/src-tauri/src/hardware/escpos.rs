pub struct EscPosBuilder {
    buffer: Vec<u8>,
    line_width: usize, // 48 for 80mm, 32 for 58mm
}

impl EscPosBuilder {
    pub fn new(is_80mm: bool) -> Self {
        let mut builder = Self {
            buffer: Vec::new(),
            line_width: if is_80mm { 48 } else { 32 },
        };
        builder.init();
        builder
    }

    pub fn init(&mut self) -> &mut Self {
        // ESC @ : Initialize printer
        self.buffer.extend_from_slice(&[0x1B, 0x40]);
        // ESC t 19 : Select PC858 (Euro / Latin-1 with accented characters)
        self.buffer.extend_from_slice(&[0x1B, 0x74, 19]);
        self
    }

    pub fn align_left(&mut self) -> &mut Self {
        self.buffer.extend_from_slice(&[0x1B, 0x61, 0]);
        self
    }

    pub fn align_center(&mut self) -> &mut Self {
        self.buffer.extend_from_slice(&[0x1B, 0x61, 1]);
        self
    }

    pub fn align_right(&mut self) -> &mut Self {
        self.buffer.extend_from_slice(&[0x1B, 0x61, 2]);
        self
    }

    pub fn bold(&mut self, enable: bool) -> &mut Self {
        self.buffer.extend_from_slice(&[0x1B, 0x45, if enable { 1 } else { 0 }]);
        self
    }

    pub fn text_size(&mut self, double_width: bool, double_height: bool) -> &mut Self {
        let mut n = 0u8;
        if double_width {
            n |= 0x20;
        }
        if double_height {
            n |= 0x01;
        }
        self.buffer.extend_from_slice(&[0x1D, 0x21, n]);
        self
    }

    pub fn feed(&mut self, lines: u8) -> &mut Self {
        self.buffer.extend_from_slice(&[0x1B, 0x64, lines]);
        self
    }

    pub fn text(&mut self, text: &str) -> &mut Self {
        // Convert UTF-8 text to CP858 compatible bytes where possible
        for c in text.chars() {
            let byte = match c {
                'é' => 0x82,
                'â' => 0x83,
                'ä' => 0x84,
                'à' => 0x85,
                'ç' => 0x87,
                'ê' => 0x88,
                'ë' => 0x89,
                'è' => 0x8A,
                'ï' => 0x8B,
                'î' => 0x8C,
                'ô' => 0x93,
                'ö' => 0x94,
                'ù' => 0x97,
                'û' => 0x96,
                'ü' => 0x81,
                '°' => 0xF8,
                '€' => 0xD5,
                ascii if (ascii as u32) < 128 => ascii as u8,
                _ => b'?',
            };
            self.buffer.push(byte);
        }
        self
    }

    pub fn line(&mut self, text: &str) -> &mut Self {
        self.text(text);
        self.buffer.push(b'\n');
        self
    }

    pub fn separator(&mut self) -> &mut Self {
        let sep = "-".repeat(self.line_width);
        self.line(&sep);
        self
    }

    pub fn double_separator(&mut self) -> &mut Self {
        let sep = "=".repeat(self.line_width);
        self.line(&sep);
        self
    }

    pub fn row(&mut self, left: &str, right: &str) -> &mut Self {
        let left_len = left.chars().count();
        let right_len = right.chars().count();

        if left_len + right_len + 1 > self.line_width {
            let max_left = self.line_width.saturating_sub(right_len + 2);
            let truncated_left: String = left.chars().take(max_left).collect();
            let spaces = self.line_width.saturating_sub(truncated_left.chars().count() + right_len);
            self.text(&truncated_left);
            self.text(&" ".repeat(spaces));
            self.text(right);
            self.buffer.push(b'\n');
        } else {
            let spaces = self.line_width.saturating_sub(left_len + right_len);
            self.text(left);
            self.text(&" ".repeat(spaces));
            self.text(right);
            self.buffer.push(b'\n');
        }
        self
    }

    pub fn barcode_128(&mut self, code: &str) -> &mut Self {
        self.align_center();
        // GS h : Height = 60 dots
        self.buffer.extend_from_slice(&[0x1D, 0x68, 60]);
        // GS w : Barcode width = 2
        self.buffer.extend_from_slice(&[0x1D, 0x77, 2]);
        // GS H : HRI characters below barcode
        self.buffer.extend_from_slice(&[0x1D, 0x48, 2]);
        // GS k 73 (Code 128)
        let bytes = code.as_bytes();
        self.buffer.extend_from_slice(&[0x1D, 0x6B, 73, (bytes.len() + 2) as u8, 0x7B, 0x42]);
        self.buffer.extend_from_slice(bytes);
        self.feed(1);
        self.align_left();
        self
    }

    pub fn open_cash_drawer(&mut self) -> &mut Self {
        // ESC p 0 25 250 : Drawer kick pulse
        self.buffer.extend_from_slice(&[0x1B, 0x70, 0x00, 25, 250]);
        self
    }

    pub fn cut_paper(&mut self) -> &mut Self {
        self.feed(3);
        // GS V 66 0 : Partial cut
        self.buffer.extend_from_slice(&[0x1D, 0x56, 66, 0]);
        self
    }

    pub fn build(self) -> Vec<u8> {
        self.buffer
    }
}
