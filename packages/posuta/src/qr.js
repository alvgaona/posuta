// QR codes as inline SVG, for hand-built markup; <QR> wraps this.
import QRCode from "qrcode";

/** An SVG QR code for `url`, black on transparent, no quiet zone. */
export const qrSvg = (url) => QRCode.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M" });
