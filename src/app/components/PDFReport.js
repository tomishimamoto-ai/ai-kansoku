import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// 日本語フォントを登録
Font.register({
  family: 'Noto Sans JP',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/notosansjp/v52/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFBEj75vY0rw-oME.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://fonts.gstatic.com/s/notosansjp/v52/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFJEj75vY0rw-oME.ttf',
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Noto Sans JP',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #000',
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 8,
    color: '#000',
  },
  subtitle: {
    fontSize: 11,
    color: '#666',
    marginBottom: 3,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 12,
    color: '#000',
  },
  scoreContainer: {
    backgroundColor: '#f5f5f5',
    padding: 25,
    borderRadius: 8,
    marginBottom: 15,
    textAlign: 'center',
  },
  totalScore: {
    fontSize: 54,
    fontWeight: 700,
    color: '#000',
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: 13,
    color: '#666',
  },
  scoreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  scoreItem: {
    width: '48%',
    backgroundColor: '#f9f9f9',
    padding: 14,
    borderRadius: 6,
    marginBottom: 10,
    borderLeft: '4 solid #ddd',
  },
  scoreItemGood: {
    borderLeftColor: '#22c55e',
  },
  scoreItemWarning: {
    borderLeftColor: '#eab308',
  },
  scoreItemBad: {
    borderLeftColor: '#ef4444',
  },
  scoreItemName: {
    fontSize: 11,
    marginBottom: 5,
    color: '#333',
  },
  scoreItemValue: {
    fontSize: 20,
    fontWeight: 700,
    color: '#000',
  },
  improvementItem: {
    backgroundColor: '#fef2f2',
    padding: 13,
    borderRadius: 6,
    marginBottom: 10,
    borderLeft: '4 solid #ef4444',
  },
  improvementTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 5,
    color: '#000',
  },
  improvementDetail: {
    fontSize: 10,
    color: '#666',
    lineHeight: 1.6,
  },
  completedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },
  completedText: {
    fontSize: 10,
    color: '#666',
    marginLeft: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: '1 solid #ddd',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 9,
    color: '#999',
    textAlign: 'center',
  },
  upgradeBox: {
    backgroundColor: '#eff6ff',
    padding: 18,
    borderRadius: 8,
    marginTop: 20,
    border: '2 solid #3b82f6',
  },
  upgradeTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1e40af',
    marginBottom: 10,
  },
  upgradeText: {
    fontSize: 10,
    color: '#1e40af',
    lineHeight: 1.7,
  },
});

const PDFReport = ({ data }) => {
  const { url, totalScore, scores, improvements } = data;
  const date = new Date().toLocaleDateString('ja-JP');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.title}>AI可視性診断レポート</Text>
          <Text style={styles.subtitle}>診断日: {date}</Text>
          <Text style={styles.subtitle}>診断URL: {url}</Text>
        </View>

        {/* 総合スコア */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>総合スコア</Text>
          <View style={styles.scoreContainer}>
            <Text style={styles.totalScore}>{totalScore}</Text>
            <Text style={styles.scoreLabel}>/ 100点</Text>
          </View>
        </View>

        {/* 詳細スコア */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>詳細スコア</Text>
          <View style={styles.scoreGrid}>
            {scores.map((item, index) => (
              <View 
                key={index} 
                style={[
                  styles.scoreItem,
                  item.status === 'good' && styles.scoreItemGood,
                  item.status === 'warning' && styles.scoreItemWarning,
                  item.status === 'bad' && styles.scoreItemBad,
                ]}
              >
                <Text style={styles.scoreItemName}>{item.name}</Text>
                <Text style={styles.scoreItemValue}>{item.score}点</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 改善ポイント（高優先度） */}
        {improvements.high && improvements.high.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>改善ポイント（高優先度）</Text>
            {improvements.high.map((item, index) => (
              <View key={index} style={styles.improvementItem}>
                <Text style={styles.improvementTitle}>{item.title}</Text>
                <Text style={styles.improvementDetail}>→ {item.detail}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 対応済み項目 */}
        {improvements.completed && improvements.completed.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>対応済み項目</Text>
            {improvements.completed.slice(0, 5).map((item, index) => (
              <View key={index} style={styles.completedItem}>
                <Text style={styles.completedText}>✓ {item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 有料プラン誘導 */}
        <View style={styles.upgradeBox}>
          <Text style={styles.upgradeTitle}>詳細レポートで更に深く分析</Text>
          <Text style={styles.upgradeText}>
            ・レーダーチャート画像付き{'\n'}
            ・メタタグ・セマンティックHTMLの詳細分析{'\n'}
            ・パフォーマンス改善の具体的なコード例{'\n'}
            ・定期モニタリング機能{'\n'}
            {'\n'}
            有料プランで全ての機能をご利用いただけます
          </Text>
        </View>

        {/* フッター */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            このレポートはAI観測ラボ (https://ai-observatory.example.com) によって生成されました
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default PDFReport;