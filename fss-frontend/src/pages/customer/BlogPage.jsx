import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, User, Clock, ArrowRight, Search, ChevronRight } from 'lucide-react';
import { blogPosts, categories } from '../../data/mockData';

const containerClass = 'layout-page';

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');

  const featuredPost = blogPosts.find(post => post.featured) || blogPosts[0];
  const regularPosts = blogPosts.filter(post => !post.featured || blogPosts.length <= 1);

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = activeCategory === 'Tất cả' || post.category === activeCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categoriesList = ['Tất cả', ...new Set(blogPosts.map(post => post.category))];

  return (
    <div className="page-enter bg-white min-h-screen pb-20">
      {/* ===== HERO SECTION ===== */}
      <section className="relative pt-20 pb-16 lg:pt-28 lg:pb-24 overflow-hidden bg-slate-50">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 -skew-x-12 translate-x-1/4" />

        <div className={containerClass}>
          <div className="relative z-10 mb-12">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-4 block"
            >
              BẢN TIN FSS
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl lg:text-6xl font-bold font-display text-headline mb-6"
            >
              Tin tức <span className="text-primary italic">Thời trang</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground max-w-2xl text-lg leading-relaxed"
            >
              Khám phá những xu hướng mới nhất, bí quyết phối đồ và câu chuyện đằng sau những bộ sưu tập tại Fashion Shopping Sense.
            </motion.p>
          </div>

          {/* Featured Post Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="group relative rounded-[2rem] overflow-hidden shadow-2xl bg-white border border-slate-100 ring-1 ring-black/5"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="relative h-64 lg:h-[500px] overflow-hidden">
                <img
                  src={featuredPost.image}
                  alt={featuredPost.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-6 left-6">
                  <span className="px-7 py-3 bg-[#00168d] text-white text-[12px] font-black uppercase tracking-[0.2em] rounded-[2px] shadow-xl">
                    {featuredPost.category}
                  </span>
                </div>
              </div>
              <div className="p-8 lg:p-16 flex flex-col justify-center">
                <div className="flex items-center gap-6 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-6">
                  <span className="flex items-center gap-2"><Calendar size={14} className="text-primary" /> {featuredPost.date}</span>
                  <span className="flex items-center gap-2"><Clock size={14} className="text-primary" /> {featuredPost.readingTime}</span>
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold font-display text-headline mb-6 group-hover:text-primary transition-colors leading-tight">
                  {featuredPost.title}
                </h2>
                <p className="text-muted-foreground text-lg mb-8 leading-relaxed line-clamp-3">
                  {featuredPost.excerpt}
                </p>
                <div className="flex items-center justify-between mt-auto pt-8 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-primary font-bold text-sm border border-white shadow-sm">FS</div>
                    <span className="text-sm font-bold text-headline">{featuredPost.author}</span>
                  </div>
                  <Link to={`/blog/${featuredPost.id}`} className="flex items-center gap-2 text-primary font-black text-[12px] uppercase tracking-widest hover:gap-4 transition-all group/btn">
                    Đọc tiếp <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== FILTER & SEARCH ===== */}
      <section className="py-10 border-b border-slate-50 bg-surface-secondary/50 backdrop-blur-sm">
        <div className={containerClass}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex items-center gap-4 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
              {categoriesList.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-8 py-4 rounded-[2px] text-[13px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${activeCategory === cat
                      ? 'bg-[#00168d] text-white border-[#00168d] shadow-lg shadow-[#00168d]/20'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="relative group min-w-[300px]">
              <input
                type="text"
                placeholder="Nhập từ khóa tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-sm text-sm font-medium focus:ring-2 ring-primary/20 transition-all outline-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== BLOG GRID ===== */}
      <section className="py-20 lg:py-32">
        <div className={containerClass}>
          {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12">
              {filteredPosts.map((post, index) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group flex flex-col"
                >
                  <div className="relative aspect-[4/3] rounded-[1.5rem] overflow-hidden mb-6 bg-slate-100 shadow-soft group-hover:shadow-elevation transition-all duration-500">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-6 py-2.5 bg-white/95 backdrop-blur-md text-[#00168d] text-[12px] font-black uppercase tracking-[0.15em] rounded-[2px] shadow-md border border-[#00168d]/10">
                        {post.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
                    <span>{post.date}</span>
                    <span className="w-1 h-1 bg-primary rounded-sm" />
                    <span>{post.readingTime} đọc</span>
                  </div>
                  <h3 className="text-xl lg:text-2xl font-bold font-display text-headline mb-4 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                    {post.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 mb-6">
                    {post.excerpt}
                  </p>
                  <Link to={`/blog/${post.id}`} className="mt-auto flex items-center gap-2 text-primary font-black text-[11px] uppercase tracking-widest hover:gap-3 transition-all">
                    Xem chi tiết <ChevronRight size={16} />
                  </Link>
                </motion.article>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-slate-50 rounded-sm border border-dashed border-slate-200">
              <Search size={48} className="mx-auto text-slate-300 mb-6" />
              <h3 className="text-2xl font-bold text-headline mb-2">Không tìm thấy bài viết</h3>
              <p className="text-muted-foreground">Thử tìm kiếm với từ khóa khác nhé!</p>
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory('Tất cả'); }}
                className="mt-8 px-8 py-3 bg-white border border-slate-200 rounded-sm font-bold text-sm hover:bg-slate-50 transition-all"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
