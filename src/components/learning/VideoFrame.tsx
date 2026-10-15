export function VideoFrame({ url }: { url: string }) {
  if (!url.startsWith("https://")) {
    return <p className="muted">This video link is not available.</p>;
  }
  const youtube = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/);
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (youtube) {
    return (
      <div className="video-frame">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtube[1]}`}
          title="Lesson video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  if (vimeo) {
    return (
      <div className="video-frame">
        <iframe src={`https://player.vimeo.com/video/${vimeo[1]}`} title="Lesson video" allowFullScreen />
      </div>
    );
  }
  if (/\.(mp4|webm)(\?|$)/i.test(url)) {
    return (
      <div className="video-frame">
        <video controls preload="metadata" src={url} />
      </div>
    );
  }
  return <p><a href={url}>Open the lesson video</a></p>;
}
