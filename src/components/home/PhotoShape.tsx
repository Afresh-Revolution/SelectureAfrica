import Image from "next/image";
import styles from "./PhotoShape.module.scss";

export function PhotoShape({
  src,
  alt,
  shape,
  motion,
  className = "",
}: {
  src: string;
  alt: string;
  shape: "circle" | "arch" | "blob" | "portrait" | "leaf" | "squircle";
  motion?: "float" | "floatLate";
  className?: string;
}) {
  return (
    <div className={`${styles.frame} ${styles[shape]} ${motion ? styles[motion] : ""} ${className}`}>
      <Image src={src} alt={alt} fill sizes="(max-width: 900px) 80vw, 360px" className={styles.img} />
    </div>
  );
}
