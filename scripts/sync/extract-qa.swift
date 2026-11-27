// Extrae las tablas de los PDF de Q&A por posición (solo macOS, PDFKit).
// Uso: swift scripts/sync/extract-qa.swift <carpeta-pdf> <salida.json>
// La salida contiene texto oficial: no se versiona (ADR-006).
import AppKit
import PDFKit

let scale: CGFloat = 2

/// Posiciones (en píxeles) de las líneas: filas o columnas mayormente oscuras.
func lines(_ count: Int, _ length: Int, _ minimum: Double, _ dark: (Int, Int) -> Bool) -> [Int] {
    var found: [Int] = []
    var previous = -10
    for line in 0..<count {
        var run = 0
        for position in 0..<length where dark(line, position) { run += 1 }
        if Double(run) >= minimum {
            if line - previous > 2 { found.append(line) }
            previous = line
        }
    }
    return found
}

func rows(of page: PDFPage) -> [[String]] {
    let box = page.bounds(for: .mediaBox)
    let width = Int(box.width * scale), height = Int(box.height * scale)
    var pixels = [UInt8](repeating: 255, count: width * height)
    pixels.withUnsafeMutableBytes { buffer in
        let context = CGContext(data: buffer.baseAddress, width: width, height: height, bitsPerComponent: 8,
            bytesPerRow: width, space: CGColorSpaceCreateDeviceGray(), bitmapInfo: CGImageAlphaInfo.none.rawValue)!
        context.setFillColor(gray: 1, alpha: 1)
        context.fill(CGRect(x: 0, y: 0, width: width, height: height))
        context.scaleBy(x: scale, y: scale)
        page.draw(with: .mediaBox, to: context)
    }
    // La fila 0 del búfer es la parte superior de la página.
    let isDark = { (x: Int, y: Int) in pixels[y * width + x] < 110 }
    let horizontal = lines(height, width, Double(width) * 0.6) { y, x in isDark(x, y) }
    guard let top = horizontal.first, let bottom = horizontal.last, horizontal.count > 1 else { return [] }
    let vertical = lines(width, height, Double(bottom - top) * 0.9) { x, y in y >= top && y <= bottom && isDark(x, y) }
    guard vertical.count > 1 else { return [] }

    return (0..<horizontal.count - 1).map { row in
        (0..<vertical.count - 1).map { column in
            let rect = CGRect(
                x: box.minX + CGFloat(vertical[column]) / scale + 1.5,
                y: box.maxY - CGFloat(horizontal[row + 1]) / scale + 1,
                width: CGFloat(vertical[column + 1] - vertical[column]) / scale - 3,
                height: CGFloat(horizontal[row + 1] - horizontal[row]) / scale - 2)
            let text = page.selection(for: rect)?.string ?? ""
            return text.replacingOccurrences(of: "<br>", with: " ")
                .split(whereSeparator: { $0.isWhitespace }).joined(separator: " ")
        }
    }
}

let arguments = CommandLine.arguments
guard arguments.count == 3 else { fatalError("Uso: extract-qa.swift <carpeta-pdf> <salida.json>") }
let folder = URL(fileURLWithPath: arguments[1])
var output: [String: Any] = [:]
for name in try FileManager.default.contentsOfDirectory(atPath: folder.path).sorted() where name.hasSuffix(".pdf") {
    guard let document = PDFDocument(url: folder.appendingPathComponent(name)) else { fatalError("No se pudo abrir \(name)") }
    output[name] = (0..<document.pageCount).map { rows(of: document.page(at: $0)!) }
}
try JSONSerialization.data(withJSONObject: output, options: [.sortedKeys, .prettyPrinted])
    .write(to: URL(fileURLWithPath: arguments[2]))
print("\(output.count) documentos")
