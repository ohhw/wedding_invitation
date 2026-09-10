"use client";

declare global {
  interface Window {
    Kakao: unknown;
  }
}

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import Image from "next/image";
import { Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

const GROOM_NAME = "오현우";
const BRIDE_NAME = "최인영";
const GROOM_NAME_EN = "HYUNWOO";
const BRIDE_NAME_EN = "INYOUNG";

const WEDDING_YEAR = 2026;
const WEDDING_MONTH_INDEX = 9; // 0-indexed (9 = October)
const WEDDING_DATE = 25;
const WEDDING_HOUR = 12; // 24h, 샘플
const WEDDING_MINUTE = 30;

const VENUE_NAME = "분당차병원";
const VENUE_ADDRESS = "경기도 성남시 분당구 야탑로 59";
const VENUE_PHONE = "031-780-5000";

const KAKAO_APP_KEY = "dd6b1af728b7149c84eb502fdf50c7ca";

const WEEKDAY_LABELS_KO = ["일", "월", "화", "수", "목", "금", "토"];

const GALLERY_IMAGES = Array.from(
  { length: 9 },
  (_, i) => `https://picsum.photos/400/500?random=${i + 1}`,
);

const GROOM_ACCOUNT = {
  bank: "신한은행",
  number: "110-274-104112",
  holder: GROOM_NAME,
};

const BRIDE_ACCOUNT = {
  bank: "국민은행",
  number: "220-987-654321",
  holder: BRIDE_NAME,
};

function formatKoreanTime(hour: number, minute: number) {
  const period = hour < 12 ? "오전" : "오후";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${period} ${hour12}시${minute ? ` ${minute}분` : ""}`;
}

function formatEnglishTime(hour: number, minute: number) {
  const period = hour < 12 ? "AM" : "PM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${period} ${hour12}:${minute.toString().padStart(2, "0")}`;
}

export default function Page() {
  type GuestbookEntry = {
    id: string;
    name: string;
    message: string;
  };

  const [guestName, setGuestName] = useState("");
  const [guestMessage, setGuestMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [guestbookMessages, setGuestbookMessages] = useState<GuestbookEntry[]>(
    [],
  );
  const [isGuestbookLoading, setIsGuestbookLoading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [openSide, setOpenSide] = useState<"groom" | "bride" | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [toast, setToast] = useState<
    { message: string; tone: "success" | "error" } | null
  >(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback(
    (message: string, tone: "success" | "error" = "success") => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
      setToast({ message, tone });
      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
      }, 2000);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const loadGuestbookMessages = useCallback(async () => {
    setIsGuestbookLoading(true);

    try {
      const response = await fetch("/api/guestbook");

      if (!response.ok) {
        throw new Error("방명록 목록을 불러오지 못했습니다.");
      }

      const data = (await response.json()) as GuestbookEntry[];
      setGuestbookMessages(data);
    } catch (error) {
      console.error("방명록 목록 불러오기 오류:", error);
      setGuestbookMessages([]);
    } finally {
      setIsGuestbookLoading(false);
    }
  }, []);

  const handleCopy = async (text: string, successMessage = "복사되었습니다.") => {
    await navigator.clipboard.writeText(text);
    showToast(successMessage);
  };

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMusicPlaying) {
      audio.pause();
      setIsMusicPlaying(false);
    } else {
      audio.play().catch(() => {
        // 샘플 음원이 없을 수 있으므로 재생 실패는 무시합니다.
      });
      setIsMusicPlaying(true);
    }
  };

  const handleGuestbookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!guestName.trim() || !guestMessage.trim()) {
      showToast("이름과 메시지를 모두 입력해 주세요.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/guestbook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: guestName,
          message: guestMessage,
        }),
      });

      if (response.ok) {
        showToast("축하 메시지가 등록되었습니다!");
        setGuestName("");
        setGuestMessage("");
        await loadGuestbookMessages();
      } else {
        showToast("메시지를 저장하는 중에 오류가 발생했습니다.", "error");
      }
    } catch (error) {
      console.error("오류:", error);
      showToast("메시지를 저장하는 중에 오류가 발생했습니다.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const kakao = window.Kakao as
      | { isInitialized?: () => boolean; init: (key: string) => void }
      | undefined;

    if (kakao?.isInitialized && !kakao.isInitialized()) {
      kakao.init(KAKAO_APP_KEY);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadGuestbookMessages();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadGuestbookMessages]);

  const shareToKakao = () => {
    if (window.Kakao) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.Kakao as any).Share.sendDefault({
        objectType: "feed",
        content: {
          title: `${GROOM_NAME} & ${BRIDE_NAME} 결혼식에 초대합니다`,
          description: `${WEDDING_YEAR}년 ${WEDDING_MONTH_INDEX + 1}월 ${WEDDING_DATE}일 ${formatKoreanTime(WEDDING_HOUR, WEDDING_MINUTE)}, ${VENUE_NAME}`,
          imageUrl: "https://picsum.photos/400/600",
          link: {
            webUrl: window.location.href,
          },
        },
      });
    }
  };

  const firstDayIndex = new Date(WEDDING_YEAR, WEDDING_MONTH_INDEX, 1).getDay();
  const daysInMonth = new Date(WEDDING_YEAR, WEDDING_MONTH_INDEX + 1, 0).getDate();
  const blanks = Array.from({ length: firstDayIndex });
  const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const weddingDate = new Date(WEDDING_YEAR, WEDDING_MONTH_INDEX, WEDDING_DATE);
  const weddingWeekday = WEEKDAY_LABELS_KO[weddingDate.getDay()];
  const weddingDateEn = weddingDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const today = new Date();
  const todayMid = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.ceil(
    (weddingDate.getTime() - todayMid.getTime()) / msPerDay,
  );

  return (
    <>
      <Script
        src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js"
        strategy="lazyOnload"
        onLoad={() => {
          // 스크립트가 성공적으로 불러와진 직후에 초기화 실행
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (window.Kakao && !(window.Kakao as any).isInitialized()) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window.Kakao as any).init(KAKAO_APP_KEY);
          }
        }}
      />
      <main className="max-w-md mx-auto min-h-screen bg-white text-gray-800 shadow-lg flex flex-col items-center">
        {/* 커버 */}
        <div className="relative w-full">
          <Image
            src="https://picsum.photos/400/600"
            alt="Wedding"
            width={400}
            height={600}
            className="w-full h-auto object-cover"
            preload
          />

          <audio ref={audioRef} src="/audio/bgm-sample.mp3" loop />

          <button
            type="button"
            onClick={toggleMusic}
            aria-label={isMusicPlaying ? "배경음악 정지" : "배경음악 재생"}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm"
          >
            {isMusicPlaying ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <rect x="4" y="4" width="16" height="16" rx="4" />
                <path d="M9 9v6m6-6v6" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            )}
          </button>

          <div className="pointer-events-none absolute inset-x-0 bottom-10 flex flex-col items-center gap-3 px-6 text-center text-white">
            <p className="font-serif text-3xl tracking-[0.25em] drop-shadow-md">
              {GROOM_NAME_EN}
              <span className="mx-2 align-middle text-xl">&amp;</span>
              {BRIDE_NAME_EN}
            </p>
            <p className="text-sm tracking-wide drop-shadow-md">
              {WEDDING_YEAR}년 {WEDDING_MONTH_INDEX + 1}월 {WEDDING_DATE}일{" "}
              {weddingWeekday}요일 {formatKoreanTime(WEDDING_HOUR, WEDDING_MINUTE)}
            </p>
            <p className="text-xs tracking-wide text-white/80 drop-shadow-md">
              {VENUE_NAME}
            </p>
          </div>
        </div>

        {/* 인사말 */}
        <section className="px-6 py-8 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 60 24"
            className="mx-auto mb-4 h-5 w-14 text-gray-300"
            fill="none"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path d="M2 12c10-8 16 4 28 0s18-8 28 0" strokeLinecap="round" />
            <path
              d="M30 8c-2-3-6-3-7 0-1-3-5-3-7 0 0 3 7 8 7 8s7-5 7-8z"
              fill="currentColor"
              stroke="none"
            />
          </svg>

          <h2 className="text-2xl font-semibold text-gray-900">초대합니다</h2>

          <p className="mt-4 text-gray-700 leading-relaxed">
            소중한 분들을 모시고 함께 기쁨을 나누고자 합니다.
            <br />
            두 사람이 함께하는 새로운 시작에 함께해 주세요.
            <br />
            따뜻한 축복과 함께 자리해 주시면 감사하겠습니다.
          </p>

          <p className="mt-6 text-sm tracking-wide text-gray-600">
            신랑 {GROOM_NAME} · 신부 {BRIDE_NAME}
          </p>
        </section>

        {/* Wedding Day */}
        <section className="w-full px-6 pb-8">
          <h3 className="text-center font-serif text-xl tracking-[0.2em] text-gray-900">
            WEDDING DAY
          </h3>

          <p className="mt-3 text-center text-sm text-gray-700">
            {WEDDING_YEAR}년 {WEDDING_MONTH_INDEX + 1}월 {WEDDING_DATE}일{" "}
            {weddingWeekday}요일 · {formatKoreanTime(WEDDING_HOUR, WEDDING_MINUTE)}
          </p>
          <p className="text-center text-xs tracking-wide text-gray-400">
            {weddingDateEn} · {formatEnglishTime(WEDDING_HOUR, WEDDING_MINUTE)}
          </p>

          <div className="mt-4 grid grid-cols-7 gap-2 text-center text-sm font-medium">
            {WEEKDAY_LABELS_KO.map((d, idx) => (
              <div
                key={d}
                className={idx === 0 ? "text-red-500" : "text-gray-600"}
              >
                {d}
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-2 text-center text-sm">
            {blanks.map((_, i) => (
              <div key={`b-${i}`} className="py-2" />
            ))}

            {dates.map((d) => {
              const weekday = new Date(
                WEDDING_YEAR,
                WEDDING_MONTH_INDEX,
                d,
              ).getDay();
              const isWedding = d === WEDDING_DATE;
              const dayTextClass =
                weekday === 0 ? "text-red-500" : "text-gray-700";

              return (
                <div key={d} className="py-2">
                  {isWedding ? (
                    <div className="mx-auto w-8 h-8 flex items-center justify-center bg-red-400 text-white rounded-full">
                      {d}
                    </div>
                  ) : (
                    <div className={dayTextClass}>{d}</div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 text-center text-sm text-gray-600">
            {GROOM_NAME} <span aria-hidden>❤</span> {BRIDE_NAME} 결혼식이{" "}
            {diffDays > 0
              ? `${diffDays}일 남았습니다`
              : diffDays === 0
                ? "오늘입니다"
                : "지났습니다"}
          </div>
        </section>

        {/* GALLERY */}
        <section className="w-full px-6 pb-10">
          <h3 className="text-center font-serif text-xl tracking-[0.2em] text-gray-900">
            GALLERY
          </h3>
          <p className="mt-2 text-center text-xs text-gray-400">
            사진을 클릭하시면 전체 화면으로 볼 수 있습니다
          </p>

          <div className="mt-5 grid grid-cols-3 gap-1.5">
            {GALLERY_IMAGES.map((src, index) => (
              <button
                key={src}
                type="button"
                onClick={() => setLightboxIndex(index)}
                className="relative aspect-[4/5] overflow-hidden bg-gray-100"
              >
                <Image
                  src={src}
                  alt={`갤러리 사진 ${index + 1}`}
                  fill
                  sizes="(max-width: 448px) 33vw, 150px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </section>

        {/* LOCATION */}
        <section className="w-full px-6 pb-12">
          <h3 className="text-center font-serif text-xl tracking-[0.2em] text-gray-900">
            LOCATION
          </h3>

          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="text-base font-medium text-gray-900">
              {VENUE_NAME}
            </span>
            <a
              href={`tel:${VENUE_PHONE}`}
              aria-label="예식장에 전화하기"
              className="text-gray-400"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M6.6 10.8a13 13 0 006.6 6.6l2.2-2.2a1 1 0 011-.25 9 9 0 002.8.45 1 1 0 011 1V19a1 1 0 01-1 1A15 15 0 014 5a1 1 0 011-1h2.5a1 1 0 011 1 9 9 0 00.45 2.8 1 1 0 01-.25 1z" />
              </svg>
            </a>
          </div>

          <div className="mt-1 flex items-center justify-center gap-2">
            <span className="text-sm text-gray-600">{VENUE_ADDRESS}</span>
            <button
              type="button"
              onClick={() => handleCopy(VENUE_ADDRESS, "주소가 복사되었습니다.")}
              aria-label="주소 복사하기"
              className="text-gray-400"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <rect x="9" y="9" width="11" height="11" rx="2" />
                <path d="M5 15V5a2 2 0 012-2h10" />
              </svg>
            </button>
          </div>

          <div className="mt-4 overflow-hidden rounded-lg bg-gray-100">
            <Image
              src="https://picsum.photos/400/300"
              alt="오시는 길 약도"
              width={400}
              height={300}
              className="h-auto w-full object-cover"
            />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <a
              href="nmap://route/public?dlat=37.5000&dlng=127.0365&dname=%ED%95%B4%ED%94%BC%EC%9B%A8%EB%94%A9%ED%99%80"
              className="rounded-lg bg-green-500 px-3 py-3 text-center text-sm font-semibold text-white"
            >
              네이버 지도
            </a>
            <a
              href="tmap://route?goalx=127.0365&goaly=37.5000&goalname=%ED%95%B4%ED%94%BC%EC%9B%A8%EB%94%A9%ED%99%80"
              className="rounded-lg bg-blue-500 px-3 py-3 text-center text-sm font-semibold text-white"
            >
              티맵
            </a>
            <a
              href="kakaonavi://navigate?destination=37.5000,127.0365"
              className="rounded-lg bg-yellow-400 px-3 py-3 text-center text-sm font-semibold text-black"
            >
              카카오내비
            </a>
          </div>

          <div className="mt-6 space-y-5 text-sm text-gray-700">
            <div className="flex gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mt-0.5 h-5 w-5 shrink-0 text-gray-400"
              >
                <path d="M3 13l1.5-4.5A2 2 0 016.4 7h11.2a2 2 0 011.9 1.5L21 13" />
                <rect x="2" y="13" width="20" height="5" rx="1.5" />
                <circle cx="7" cy="18.5" r="1.5" />
                <circle cx="17" cy="18.5" r="1.5" />
              </svg>
              <div>
                <div className="font-semibold text-gray-900">자차</div>
                <p className="mt-1 leading-relaxed">
                  내비게이션 검색명: &apos;{VENUE_NAME}&apos;
                  <br />
                  정확한 주소: {VENUE_ADDRESS}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mt-0.5 h-5 w-5 shrink-0 text-gray-400"
              >
                <rect x="4" y="4" width="16" height="13" rx="2" />
                <path d="M4 11h16" />
                <circle cx="8" cy="19.5" r="1.5" />
                <circle cx="16" cy="19.5" r="1.5" />
              </svg>
              <div>
                <div className="font-semibold text-gray-900">버스</div>
                <p className="mt-1 leading-relaxed">
                  예식장 앞 정류장 하차 (샘플)
                  <br />
                  주요 노선: 720, 730, 900
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mt-0.5 h-5 w-5 shrink-0 text-gray-400"
              >
                <rect x="5" y="3" width="14" height="14" rx="4" />
                <path d="M5 12h14" />
                <circle cx="9" cy="8" r="1" />
                <circle cx="15" cy="8" r="1" />
                <path d="M8 21l1.5-3M16 21l-1.5-3" />
              </svg>
              <div>
                <div className="font-semibold text-gray-900">지하철</div>
                <p className="mt-1 leading-relaxed">
                  분당선 이매역 3번 출구에서 도보 5분 (샘플)
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mt-0.5 h-5 w-5 shrink-0 text-gray-400"
              >
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path d="M9 16V8h3.5a2.5 2.5 0 010 5H9" />
              </svg>
              <div>
                <div className="font-semibold text-gray-900">주차</div>
                <p className="mt-1 leading-relaxed">
                  예식장 지하주차장 이용 가능 (하객 2시간 무료, 샘플)
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 마음 전하실 곳 */}
        <section className="w-full px-6 pb-14">
          <h3 className="text-center font-serif text-xl tracking-[0.2em] text-gray-900">
            마음 전하실 곳
          </h3>

          <p className="mt-3 text-center text-sm leading-relaxed text-gray-600">
            참석하지 못하시더라도 축하해 주시는 마음 감사히 받겠습니다.
          </p>

          <div className="mt-5 space-y-3">
            {(
              [
                { key: "groom" as const, label: "신랑측에게", account: GROOM_ACCOUNT },
                { key: "bride" as const, label: "신부측에게", account: BRIDE_ACCOUNT },
              ]
            ).map((side) => {
              const isOpen = openSide === side.key;

              return (
                <div key={side.key} className="rounded-lg bg-gray-50">
                  <button
                    type="button"
                    onClick={() => setOpenSide(isOpen ? null : side.key)}
                    className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-gray-900"
                  >
                    {side.label}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`h-4 w-4 text-gray-400 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4">
                      <div className="text-sm text-gray-700">
                        {side.account.bank}
                      </div>

                      <div className="mt-2 flex flex-col gap-2">
                        <div className="text-sm text-gray-800">
                          {side.account.number}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              side.account.number,
                              "계좌번호가 복사되었습니다.",
                            )
                          }
                          className="w-fit rounded bg-gray-200 px-3 py-1 text-sm"
                        >
                          복사하기
                        </button>
                      </div>

                      <div className="mt-2 text-sm text-gray-700">
                        예금주: {side.account.holder}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 프라이빗 스냅샷 수집 버튼 섹션 */}
        <section className="py-8 px-6 bg-white flex flex-col items-center">
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            우리의 시선, 여러분의 기록
          </h3>
          <p className="text-sm text-gray-500 mb-6 text-center break-keep">
            예식 당일, 하객 여러분의 앨범에 담긴 아름다운 순간들을 공유해
            주세요.
            <br />
            <span className="text-xs text-gray-400">
              * 보내주신 사진은 신랑과 신부만 확인할 수 있습니다.
            </span>
          </p>

          {/* 구글 설문지 링크 연결 버튼 */}
          <a
            href="https://forms.gle/QsWd6bUfcboP4S9c6"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full max-w-sm flex justify-center items-center gap-2 py-4 bg-gray-800 text-white font-medium rounded-xl shadow-md hover:bg-gray-900 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            고화질 원본 사진/영상 보내기
          </a>
        </section>

        {/* 방명록 */}
        <section className="w-full px-6 pb-10">
          <h3 className="text-lg font-medium text-gray-900 text-center">
            방명록
          </h3>

          <form onSubmit={handleGuestbookSubmit} className="mt-4 space-y-3">
            <input
              type="text"
              placeholder="이름을 입력해 주세요"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />

            <textarea
              placeholder="축하 메시지를 입력해 주세요"
              value={guestMessage}
              onChange={(e) => setGuestMessage(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-red-400 py-2 text-sm font-semibold text-white disabled:bg-gray-400"
            >
              {isSubmitting ? "전송 중..." : "메시지 남기기"}
            </button>
          </form>

          <div className="mt-6">
            {isGuestbookLoading ? (
              <div className="rounded-xl bg-pink-50 p-4 text-center text-sm text-gray-600 shadow-sm">
                방명록을 불러오는 중이에요...
              </div>
            ) : guestbookMessages.length === 0 ? (
              <div className="rounded-xl bg-pink-50 p-4 text-center text-sm text-gray-600 shadow-sm">
                첫 번째 축하 메시지를 남겨주세요!
              </div>
            ) : (
              <Swiper
                modules={[Pagination]}
                spaceBetween={16}
                slidesPerView={1.5}
                pagination={{ clickable: true }}
                className="w-full pb-6"
              >
                {guestbookMessages.map((item) => (
                  <SwiperSlide key={item.id}>
                    <div className="h-full rounded-xl bg-pink-50 p-4 shadow-sm">
                      <div className="text-sm font-bold text-gray-900">
                        {item.name || "익명"}
                      </div>
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-700">
                        {item.message || " "}
                      </p>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            )}
          </div>
        </section>

        {/* 마무리 */}
        <section className="relative w-full">
          <Image
            src="https://picsum.photos/400/500?random=99"
            alt="마무리 사진"
            width={400}
            height={500}
            className="h-auto w-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 px-8 text-center">
            <p className="font-serif text-base leading-relaxed text-white drop-shadow-md">
              귀한 발걸음으로 참석해주시는
              <br />
              모든 분들께 진심으로 감사드립니다
            </p>
          </div>
        </section>

        <section className="w-full px-6 py-10">
          <h3 className="text-center font-serif text-xl tracking-[0.2em] text-gray-900">
            청첩장 공유하기
          </h3>

          <button
            type="button"
            onClick={shareToKakao}
            className="mt-4 w-full rounded-lg bg-[#FEE500] py-3 text-black font-bold"
          >
            카카오톡으로 공유하기
          </button>

          <button
            type="button"
            onClick={() =>
              handleCopy(window.location.href, "청첩장 주소가 복사되었습니다.")
            }
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 py-3 text-sm font-medium text-gray-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <rect x="9" y="9" width="11" height="11" rx="2" />
              <path d="M5 15V5a2 2 0 012-2h10" />
            </svg>
            청첩장 주소 복사하기
          </button>
        </section>

        {/* 카피라이트 섹션 */}
        <footer className="w-full py-8 text-center border-t border-gray-100 bg-white mt-2">
          <p className="text-xs text-gray-400 font-light tracking-widest">
            © 2026 Oh. All rights reserved.
          </p>
        </footer>
      </main>

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            aria-label="닫기"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-2xl text-white"
          >
            ×
          </button>

          <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <Swiper
              modules={[Navigation]}
              navigation
              initialSlide={lightboxIndex}
              slidesPerView={1}
              style={
                {
                  "--swiper-navigation-color": "#fff",
                  "--swiper-navigation-size": "20px",
                } as React.CSSProperties
              }
            >
              {GALLERY_IMAGES.map((src, index) => (
                <SwiperSlide key={src}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`갤러리 사진 ${index + 1} 전체화면`}
                    className="mx-auto max-h-[80vh] w-auto object-contain"
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      )}

      {toast && (
        <div
          className="fixed inset-x-0 bottom-6 z-60 flex justify-center px-6"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div
            role="status"
            aria-live="polite"
            className={`max-w-xs animate-[toast-in_0.2s_ease-out] rounded-full px-5 py-3 text-center text-sm font-medium text-white shadow-lg ${
              toast.tone === "error" ? "bg-red-500" : "bg-gray-900/90"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </>
  );
}
