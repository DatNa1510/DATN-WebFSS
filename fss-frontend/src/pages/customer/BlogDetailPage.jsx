import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowLeft, User } from 'lucide-react';
import { blogPosts } from '../../data/mockData';

export default function BlogDetailPage() {
  const { id } = useParams();
  const [post, setPost] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const foundPost = blogPosts.find(p => p.id === parseInt(id));
    setPost(foundPost);
  }, [id]);

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-white page-enter">
        <h1 className="text-6xl font-bold font-display text-primary mb-4 block">404</h1>
        <p className="text-xl text-muted-foreground mb-8">Rất tiếc, bài viết này không tồn tại.</p>
        <Link to="/blog" className="px-8 py-3 bg-primary text-white font-bold rounded-xs hover:opacity-90 transition-opacity">
          Quay lại trang Blog
        </Link>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-white pb-32 page-enter">
      {/* ===== HERO IMAGE & TITLE ===== */}
      <section className="relative w-full h-[60vh] lg:h-[70vh] bg-slate-100 overflow-hidden flex items-end">
         <img src={post.image} alt={post.title} className="absolute inset-0 w-full h-full object-cover" />
         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
         
         <div className="relative w-full layout-page pb-12 lg:pb-16 text-white z-10">
           <Link to="/blog" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-xs font-bold uppercase tracking-widest mb-8 transition-colors">
              <ArrowLeft size={16} /> Về trang chủ Blog
           </Link>
           <div className="flex items-center gap-4 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-white/90 mb-5">
              <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-xs border border-white/10">{post.category}</span>
              <span className="flex items-center gap-1.5"><Calendar size={14} /> {post.date}</span>
              <span className="flex items-center gap-1.5"><Clock size={14} /> {post.readingTime} đọc</span>
           </div>
           <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display leading-tight max-w-4xl text-white">
             {post.title}
           </h1>
         </div>
      </section>

      {/* ===== CONTENT ===== */}
      <section className="layout-page pt-12 lg:pt-20">
        <div className="max-w-3xl mx-auto">
           {/* Author Info */}
           <div className="flex items-center gap-4 pb-8 border-b border-border/50 mb-10 lg:mb-12">
             <div className="w-12 h-12 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center text-primary font-bold shadow-soft">
               <User size={20} />
             </div>
             <div>
               <p className="font-bold text-foreground text-[13px] uppercase tracking-wider">{post.author}</p>
               <p className="text-xs text-muted-foreground mt-1">Đăng ngày {post.date}</p>
             </div>
           </div>

           {/* Content */}
           <article className="prose prose-slate prose-img:rounded-md max-w-none selection:bg-primary-100 selection:text-primary">
              <p className="text-xl lg:text-2xl text-headline font-medium leading-relaxed italic border-l-4 border-primary pl-6 mb-10 text-slate-700">
                "{post.excerpt}"
              </p>
              
              <div className="text-slate-600 text-[16px] leading-[1.8] space-y-6">
                <p>Năm nay, thế giới thời trang đang chứng kiến một cuộc cách mạng lặng lẽ nhưng vô cùng mạnh mẽ. Những xu hướng thiết kế mang tính ứng dụng cao, đề cao chất liệu tự nhiên và trải nghiệm thoải mái cá nhân đang dần thay thế những món đồ hào nhoáng mang tính chạy theo trào lưu chớp nhoáng (fast-fashion).</p>
                
                <h3 className="text-2xl font-display font-bold text-headline mt-10 mb-4">Sức hút nguyên bản từ những điều cơ bản</h3>
                <p>Không khó để bắt gặp trên các sàn diễn lớn từ Paris đến Milan hay qua những bộ hình thời trang đường phố (street style), các Fashionista đang lăng xê vô cùng tích cực những item có màu sắc trung tính nhã nhặn như kem, beige, xám, và các dải màu pastel nhẹ nhàng. Việc chuyển dịch tone màu này không chỉ tôn lên nét đẹp thanh lịch của người mặc mà còn giúp trang phục dễ dàng hòa hợp với mọi vóc dáng và độ tuổi.</p>
                
                <div className="my-10">
                   <img src={post.image} alt="Xu hướng thời trang" className="w-full rounded-xs shadow-soft hover:shadow-lg transition-all duration-300" />
                   <p className="text-center text-sm text-muted-foreground mt-4 italic">Hình ảnh mang tính chất minh họa cho xu hướng đang thịnh hành.</p>
                </div>

                <h3 className="text-2xl font-display font-bold text-headline mt-10 mb-4">Chất liệu cao cấp dần chiếm thế thượng phong</h3>
                <p>Sự tinh tế thực sự không chỉ rành rọt ở vẻ bề ngoài mà còn nằm ở sự thoải mái khi chất vải chạm vào làn da. Các chuyên gia dự báo Silk (Lụa), Linen (Lanh) mịn và Cotton hữu cơ (Organic Cotton) sẽ là 3 loại chất liệu "thống trị" tủ áo của bất kỳ sự lựa chọn nào hướng tới cái đẹp bền vững và sự hoàn mỹ.</p>
                <p>Việc đầu tư cho những món đồ chất lượng cao giúp bạn có trải nghiệm tuyệt vời, tăng tuổi thọ sản phẩm và cũng là đóng góp tích cực vào chuỗi cung ứng thời trang xanh, bảo vệ môi trường.</p>
                
                <div className="bg-primary-50 border-l-4 border-primary p-6 my-10 rounded-r-md">
                  <p className="font-bold text-primary-800 m-0 leading-relaxed">
                    "Thời trang suy cho cùng chính là tấm gương phản chiếu nội tâm và thái độ sống của bạn. Một trang phục tuyệt vời là khi biểu tượng đó giúp bạn tự tin nhất và là chính mình nhất ở bất cứ đâu."
                  </p>
                </div>
              </div>
           </article>


        </div>
      </section>

    </div>
  );
}
