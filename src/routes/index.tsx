import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { ProductCard } from "@/components/ProductCard";
import { DailyNote } from "@/components/DailyNote";
import { BotanicalSeal, LeafDivider } from "@/components/CraftOrnaments";
import { collections, intentions } from "@/data/products";
import { useI18n } from "@/lib/i18n";
import heroImage from "@/assets/editorial/tiger-eye-wood.jpg";
import builderImage from "@/assets/products/make-your-own.webp";
import craftImage from "@/assets/craft.jpg";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "PASHAN — Wear Your Intention" }, { name:"description", content:"Natural stone bracelets, thoughtfully made in India." }] }),
  component: Index,
});

function Index() {
  const { t } = useI18n();
  return <SiteLayout>
    <section className="makeover-hero">
      <div className="makeover-hero-copy">
        <p className="eyebrow">PASHAN · Orange, earth & intention</p>
        <h1>{t("headline")}</h1>
        <p className="makeover-lede">{t("intro")}</p>
        <div className="makeover-actions">
          <Link to="/collections" className="btn-gold">{t("shopCta")} <span>→</span></Link>
          <Link to="/products/$slug" params={{slug:"make-your-own"}} className="btn-paper">{t("makeCta")} <span>→</span></Link>
        </div>
        <LeafDivider className="makeover-divider" />
      </div>
      <div className="makeover-hero-image"><BotanicalSeal className="makeover-seal"/><img src={heroImage} alt="Tiger Eye bracelet on a warm wood surface" fetchPriority="high" /></div>
    </section>

    <section className="makeover-products section-space"><div className="container-luxe">
      <div className="makeover-heading"><div><p className="eyebrow">Explore our bracelets</p><h2>{t("featured")}</h2></div><Link to="/collections">View all →</Link></div>
      <div className="collection-grid-premium">{collections.filter(item=>!item.isCustom).slice(0,4).map((product,index)=><ProductCard key={product.slug} product={product} index={index}/>)}</div>
    </div></section>

    <section className="makeover-builder container-luxe"><div className="makeover-builder-copy"><p className="eyebrow">Your stones. Your direction.</p><h2>{t("makeTitle")}</h2><p>{t("makeBody")}</p><ol><li><b>1</b> Choose your stones</li><li><b>2</b> Find your fit</li><li><b>3</b> Review your design</li></ol><Link to="/products/$slug" params={{slug:"make-your-own"}} className="btn-dark">Start creating →</Link></div><div className="makeover-builder-image"><img src={builderImage} alt="Mixed natural stone bracelet on warm paper" loading="lazy" /></div></section>

    <section className="makeover-finder section-space"><div className="container-luxe"><p className="eyebrow">Find a stone you connect with</p><h2>Begin with what you want to carry.</h2><div className="makeover-intentions">{intentions.slice(0,6).map(item=><Link key={item.key} to="/products/$slug" params={{slug:item.slug}}>{item.label}<span>→</span></Link>)}</div><Link to="/find-your-bracelet" className="text-link">Use the stone finder →</Link></div></section>
    <DailyNote />
    <section className="makeover-story container-luxe section-space"><div className="makeover-story-image"><img src={craftImage} alt="Hands working carefully with natural stone" loading="lazy" /></div><div><p className="eyebrow">Objects of intention</p><h2>Ancient symbols, modern desire.</h2><p>We do not promise magic. We make meaningful objects: natural stones, honest symbolism, fine presentation, and a daily invitation to choose deliberately.</p><blockquote>“A creation is born when one keeps the faith and finds the divine madness within.”</blockquote><Link to="/about" className="text-link">{t("story")} →</Link></div></section>
    <section className="makeover-newsletter"><div className="container-luxe"><p className="eyebrow">{t("weekly")}</p><h2>One thoughtful email each week.</h2><p>Stone stories, care notes and new pieces. No daily messages.</p><Link to="/contact" className="btn-paper">Join through our contact page →</Link></div></section>
  </SiteLayout>;
}
