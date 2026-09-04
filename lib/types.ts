export type ArticlePost = {
  id: string;
  type: "article";
  title: string;
  description: string;
  createdAt: string;
};

export type VideoPost = {
  id: string;
  type: "video";
  title: string;
  description: string;
  videoUrl: string;
  createdAt: string;
};

export type NewsPost = ArticlePost | VideoPost;
