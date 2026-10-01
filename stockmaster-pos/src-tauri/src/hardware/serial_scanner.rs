use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScannerConfig {
    pub enabled: bool,
    pub port_name: Option<String>,
    pub baud_rate: u32,
    pub prefix: Option<String>,
    pub suffix: Option<String>,
}

impl Default for ScannerConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            port_name: None,
            baud_rate: 9600,
            prefix: None,
            suffix: Some("\r".to_string()),
        }
    }
}
