'use client';
import Link from 'next/link';
import { useState } from 'react';

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      category: "基本的な使い方",
      questions: [
        {
          q: "AI観測ラボとは何ですか？",
          a: "AI観測ラボは、あなたのウェブサイトがChatGPT、Claude、Perplexityなど主要AIにどう見えているかを診断するツールです。robots.txt、sitemap.xml、構造化データなど8項目を無料で分析し、改善点を提案します。"
        },
        {
          q: "利用料金はかかりますか？",
          a: "基本的な診断機能は完全無料です。登録も不要で、URLを入力するだけですぐに診断できます。将来的には、より詳細な分析やモニタリング機能を含む有料プランを提供予定です。"
        },
        {
          q: "診断にどのくらい時間がかかりますか？",
          a: "通常10〜30秒程度で診断が完了します。サイトの規模やサーバーの応答速度によって多少前後する場合があります。"
        },
        {
          q: "診断結果のデータは保存されますか？",
          a: "診断結果はあなたのブラウザ（LocalStorage）にのみ保存され、サーバーには送信されません。プライバシーを重視した設計になっています。ブラウザのキャッシュをクリアすると履歴も削除されます。"
        }
      ]
    },
    {
      category: "診断内容について",
      questions: [
        {
          q: "どのような項目を診断しますか？",
          a: "以下の8項目を診断します：\n\n1. 構造化データ（JSON-LD）\n2. robots.txt\n3. sitemap.xml\n4. llms.txt\n5. メタタグ（title、description、OGP）\n6. セマンティックHTML\n7. モバイル対応\n8. パフォーマンス"
        },
        {
          q: "スコアはどのように計算されますか？",
          a: "各項目を0〜100点で評価し、その平均値が総合スコアとなります。80点以上は優秀、60〜79点は良好、59点以下は改善が必要と判断されます。"
        },
        {
          q: "llms.txtとは何ですか？",
          a: "llms.txtは、AI専用のサイトマップファイルです。AIがあなたのサイトを効率的にクロールできるよう、重要なページや情報を構造化して提供します。まだ新しい規格ですが、今後重要性が増すと予想されています。"
        },
        {
          q: "診断結果が低いとどうなりますか？",
          a: "スコアが低い場合、AIがあなたのサイトを正確に理解できず、検索結果や要約に表示されにくくなる可能性があります。改善ガイドを参考に、各項目を最適化することをおすすめします。"
        }
      ]
    },
    {
      category: "トラブルシューティング",
      questions: [
        {
          q: "「サイトが見つかりませんでした」と表示されます",
          a: "以下を確認してください：\n\n• URLが正しいか（https://を含む完全なURL）\n• サイトが実際に公開されているか\n• ファイアウォールでブロックされていないか\n• サーバーが応答しているか"
        },
        {
          q: "診断が途中で止まってしまいます",
          a: "以下を試してください：\n\n• ページをリロードして再度診断\n• 別のブラウザで試す\n• 時間を置いてから再度試す\n• サイトのサーバーが重い場合、タイムアウトする可能性があります"
        },
        {
          q: "自分のサイトで実装したはずの機能が検出されません",
          a: "以下を確認してください：\n\n• HTMLが正しく出力されているか\n• JavaScriptで動的に生成される内容は検出されない場合があります\n• robots.txtで診断ツールがブロックされていないか\n• キャッシュをクリアしてから再度診断"
        },
        {
          q: "スマホで診断できますか？",
          a: "はい、スマホやタブレットでも診断可能です。レスポンシブデザインに対応しているため、あらゆるデバイスで快適にご利用いただけます。"
        }
      ]
    },
    {
      category: "改善について",
      questions: [
        {
          q: "改善ガイドに従えば本当にスコアが上がりますか？",
          a: "はい。改善ガイドは実際にAIクローラーが評価する項目に基づいています。指示に従って実装すれば、確実にスコアが向上します。"
        },
        {
          q: "どの項目から改善すべきですか？",
          a: "診断結果の「改善ポイント」に表示される高優先度の項目から取り組むことをおすすめします。特にrobots.txtとsitemap.xmlは基本中の基本なので、最優先で対応しましょう。"
        },
        {
          q: "改善後、どのくらいで効果が出ますか？",
          a: "改善内容によりますが、robots.txtやsitemap.xmlの設定は数日〜1週間程度でAIクローラーに反映されます。構造化データは即座に効果が現れる場合もあります。定期的に再診断して変化を確認しましょう。"
        },
        {
          q: "技術的な知識がなくても改善できますか？",
          a: "はい。改善ガイドでは、コピー＆ペーストで使えるコード例を多数掲載しています。HTMLの基礎知識があれば、ほとんどの改善を自分で実装できます。"
        }
      ]
    },
    {
      category: "その他",
      questions: [
        {
          q: "競合サイトを診断できますか？",
          a: "はい、公開されているサイトであれば、どのサイトでも診断可能です。競合分析にもご活用ください。"
        },
        {
          q: "診断結果をチームで共有できますか？",
          a: "診断結果ページのURLを共有するか、PDF出力機能を使ってレポートをダウンロードできます。"
        },
        {
          q: "定期的に診断すべきですか？",
          a: "はい。サイトを更新したタイミングや、月1回程度の定期診断をおすすめします。診断履歴機能でスコアの推移を確認できます。"
        },
        {
          q: "フィードバックや要望を送りたいです",
          a: "各ページ下部の「フィードバック」ボタン、またはTwitter（@your_twitter）までお気軽にご連絡ください。皆様のご意見をもとに、サービスを改善していきます。"
        }
      ]
    }
  ];

  const toggleQuestion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="border-b border-white/10 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 md:py-6 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg" />
              <span className="text-lg md:text-xl font-bold">AI観測ラボ</span>
            </Link>
            <div className="flex gap-3 md:gap-4 text-xs md:text-sm">
              <Link href="/how-to-use" className="text-gray-400 hover:text-white transition-colors">使い方</Link>
              <Link href="/guide" className="text-gray-400 hover:text-white transition-colors">改善ガイド</Link>
              <Link href="/faq" className="text-white font-medium">FAQ</Link>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
          {/* Header */}
          <div className="mb-8 md:mb-12 text-center">
            <div className="text-5xl md:text-6xl mb-4">❓</div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4">よくある質問</h1>
            <p className="text-sm md:text-base text-gray-400">AI観測ラボに関する疑問を解決します</p>
          </div>

          {/* FAQ Sections */}
          <div className="space-y-8">
            {faqs.map((section, sectionIndex) => (
              <div key={sectionIndex} className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 md:p-8">
                <h2 className="text-xl md:text-2xl font-bold mb-6">{section.category}</h2>
                
                <div className="space-y-4">
                  {section.questions.map((item, questionIndex) => {
                    const globalIndex = `${sectionIndex}-${questionIndex}`;
                    const isOpen = openIndex === globalIndex;
                    
                    return (
                      <div
                        key={questionIndex}
                        className="bg-white/5 rounded-xl border border-white/10 overflow-hidden"
                      >
                        <button
                          onClick={() => toggleQuestion(globalIndex)}
                          className="w-full px-4 md:px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                        >
                          <span className="font-medium text-sm md:text-base pr-4">{item.q}</span>
                          <span className={`text-xl transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                            ▼
                          </span>
                        </button>
                        
                        {isOpen && (
                          <div className="px-4 md:px-6 pb-4 text-sm md:text-base text-gray-400 whitespace-pre-line">
                            {item.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-12 text-center bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10 rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-4">まだ疑問が解決しませんか？</h3>
            <p className="text-gray-400 mb-6">まずは実際に診断してみましょう！</p>
            <Link
              href="/"
              className="inline-block px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95"
            >
              🔍 無料で診断する
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}