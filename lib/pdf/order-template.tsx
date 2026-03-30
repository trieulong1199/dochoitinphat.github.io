import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import { format } from 'date-fns'
import type { LarkOrder } from '@/lib/lark/orders'

Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmEU9vBh05IsDqlA.ttf', fontWeight: 700 },
  ],
})

const styles = StyleSheet.create({
  page: { fontFamily: 'Roboto', fontSize: 10, padding: 40, color: '#1a1a1a' },
  header: { marginBottom: 20, borderBottom: '2pt solid #2563EB', paddingBottom: 12 },
  companyName: { fontSize: 18, fontWeight: 700, color: '#2563EB', marginBottom: 4 },
  orderTitle: { fontSize: 14, fontWeight: 700, marginBottom: 4 },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { width: 120, color: '#6b7280' },
  value: { flex: 1, fontWeight: 700 },
  table: { marginTop: 16 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#2563EB', color: 'white', padding: '6 4', fontWeight: 700 },
  tableRow: { flexDirection: 'row', borderBottom: '1pt solid #e5e7eb', padding: '5 4' },
  tableRowEven: { backgroundColor: '#f9fafb' },
  colNo: { width: '5%' },
  colSku: { width: '12%' },
  colName: { width: '33%' },
  colQC: { width: '10%', textAlign: 'center' },
  colGiaVip: { width: '13%', textAlign: 'right' },
  colGiaThung: { width: '13%', textAlign: 'right' },
  colSoLuong: { width: '8%', textAlign: 'center' },
  colThanhTien: { width: '16%', textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, paddingTop: 8, borderTop: '2pt solid #2563EB' },
  totalLabel: { fontWeight: 700, fontSize: 12, marginRight: 16 },
  totalValue: { fontWeight: 700, fontSize: 12, color: '#dc2626' },
  footer: { marginTop: 32, flexDirection: 'row', justifyContent: 'space-between' },
  signBox: { width: '45%', textAlign: 'center' },
  signTitle: { fontWeight: 700, marginBottom: 40 },
})

function fmt(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n) + ' đ'
}

export function OrderPDFDocument({ order }: { order: LarkOrder }) {
  const items = order.items ?? []
  const createdAt = (() => {
    try { return format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm') }
    catch { return order.createdAt }
  })()

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.companyName}>ĐỒ CHƠI TÍN PHÁT</Text>
          <Text style={styles.orderTitle}>PHIẾU ĐẶT HÀNG SỈ</Text>
        </View>

        <View style={{ marginBottom: 16 }}>
          <View style={styles.row}>
            <Text style={styles.label}>Mã đơn hàng:</Text>
            <Text style={styles.value}>{order.orderCode}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Đại lý:</Text>
            <Text style={styles.value}>{order.companyName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Số điện thoại:</Text>
            <Text style={styles.value}>{order.phone || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Ngày đặt:</Text>
            <Text style={styles.value}>{createdAt}</Text>
          </View>
          {order.note && (
            <View style={styles.row}>
              <Text style={styles.label}>Ghi chú:</Text>
              <Text style={styles.value}>{order.note}</Text>
            </View>
          )}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colNo}>#</Text>
            <Text style={styles.colSku}>SKU</Text>
            <Text style={styles.colName}>Tên hàng</Text>
            <Text style={styles.colQC}>QC</Text>
            <Text style={styles.colGiaVip}>Giá/cái</Text>
            <Text style={styles.colGiaThung}>Giá/thùng</Text>
            <Text style={styles.colSoLuong}>SL</Text>
            <Text style={styles.colThanhTien}>Thành tiền</Text>
          </View>

          {items.map((item, idx) => (
            <View key={item.larkSkuId + idx} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowEven : {}]}>
              <Text style={styles.colNo}>{idx + 1}</Text>
              <Text style={styles.colSku}>{item.sku}</Text>
              <Text style={styles.colName}>{item.name}</Text>
              <Text style={styles.colQC}>{item.quiCach}</Text>
              <Text style={styles.colGiaVip}>{fmt(item.giaVip)}</Text>
              <Text style={styles.colGiaThung}>{fmt(item.giaThung)}</Text>
              <Text style={styles.colSoLuong}>{item.soLuongThung}</Text>
              <Text style={styles.colThanhTien}>{fmt(item.thanhTien)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TỔNG CỘNG:</Text>
          <Text style={styles.totalValue}>{fmt(order.totalAmount)}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.signBox}>
            <Text style={styles.signTitle}>Đại lý</Text>
            <Text>(Ký, ghi rõ họ tên)</Text>
          </View>
          <View style={styles.signBox}>
            <Text style={styles.signTitle}>Nhà cung cấp</Text>
            <Text>(Ký, ghi rõ họ tên)</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
