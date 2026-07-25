"use client";

declare global {
  interface Window {
    Kakao: unknown;
  }
}

import { useCallback, useEffect, useState } from "react";
import Script from "next/script";
import Image from "next/image";
import { Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/pagination";

export default function Page() {
  const year = 2026;
  const month = 9; // October (0-indexed)

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

  const handleCopy = async (accountNumber: string) => {
    await navigator.clipboard.writeText(accountNumber);
    alert("계좌번호가 복사되었습니다.");
  };

  const handleGuestbookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!guestName.trim() || !guestMessage.trim()) {
      alert("이름과 메시지를 모두 입력해 주세요.");
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
        alert("축하 메시지가 등록되었습니다!");
        setGuestName("");
        setGuestMessage("");
        await loadGuestbookMessages();
      } else {
        alert("메시지를 저장하는 중에 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("오류:", error);
      alert("메시지를 저장하는 중에 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (
      window.Kakao &&
      (window.Kakao as any).isInitialized &&
      !(window.Kakao as any).isInitialized()
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.Kakao as any).init(process.env.NEXT_PUBLIC_KAKAO_APP_KEY);
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
          title: "오현우 & 최인영 결혼식에 초대합니다",
          description: "2027년 10월 30일 12시 34분, 분당차병원",
          imageUrl: "https://picsum.photos/400/600",
          link: {
            webUrl: window.location.href,
          },
        },
      });
    }
  };

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const blanks = Array.from({ length: firstDayIndex });
  const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const today = new Date();
  const todayMid = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const targetMid = new Date(year, month, 25);
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.ceil(
    (targetMid.getTime() - todayMid.getTime()) / msPerDay,
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
            (window.Kakao as any).init(process.env.NEXT_PUBLIC_KAKAO_APP_KEY);
          }
        }}
      />
      <main className="max-w-md mx-auto min-h-screen bg-white text-gray-800 shadow-lg flex flex-col items-center">
        <div className="w-full">
          <Image
            src="https://picsum.photos/400/600"
            alt="Wedding"
            width={400}
            height={600}
            className="w-full h-auto object-cover"
            priority
          />
        </div>

        <section className="px-6 py-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-900">초대합니다</h2>

          <p className="mt-4 text-gray-700 leading-relaxed">
            소중한 분들을 모시고 함께 기쁨을 나누고자 합니다.
            <br />
            두 사람이 함께하는 새로운 시작에 함께해 주세요.
            <br />
            따뜻한 축복과 함께 자리해 주시면 감사하겠습니다.
          </p>
        </section>

        <section className="w-full px-6 pb-8">
          <h3 className="text-lg font-medium text-gray-900 text-center">{`${year}년 ${month + 1}월 25일`}</h3>

          <div className="mt-4 grid grid-cols-7 gap-2 text-center text-sm font-medium">
            {["일", "월", "화", "수", "목", "금", "토"].map((d, idx) => (
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
              const weekday = new Date(year, month, d).getDay();
              const isWedding = d === 25;
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

          <div className="mt-6 text-center">
            <div className="text-sm text-gray-600">결혼식까지 남은 기간</div>
            <div className="mt-2 text-xl font-semibold">
              D-Day {Math.max(diffDays, 0)}
            </div>
          </div>
        </section>

        <section className="w-full px-6 pb-10">
          <h3 className="text-lg font-medium text-gray-900 text-center">
            갤러리
          </h3>

          <div className="mt-4">
            <Swiper
              modules={[Pagination]}
              spaceBetween={16}
              slidesPerView={1}
              pagination={{ clickable: true }}
              className="w-full"
            >
              {[
                "https://picsum.photos/400/500?random=1",
                "https://picsum.photos/400/500?random=2",
                "https://picsum.photos/400/500?random=3",
                "https://picsum.photos/400/500?random=4",
                "https://picsum.photos/400/500?random=5",
              ].map((src, index) => (
                <SwiperSlide key={src}>
                  <div className="overflow-hidden rounded-lg bg-gray-100">
                    <Image
                      src={src}
                      alt={`갤러리 사진 ${index + 1}`}
                      width={400}
                      height={500}
                      className="h-auto w-full object-cover rounded-lg"
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </section>

        {/* 3x3 웨딩 스냅샷 그리드 섹션 */}
        <section className="py-8 px-4 bg-white">
          <h3 className="text-center text-lg font-semibold text-gray-800 mb-6 tracking-wide">
            WEDDING SNAPSHOTS
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <div
                key={num}
                className="aspect-square relative overflow-hidden rounded-lg bg-gray-100 shadow-sm"
              >
                <img
                  src={`https://picsum.photos/300/300?random=${num + 20}`}
                  alt={`웨딩 스냅샷 ${num}`}
                  className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </section>

        <section className="w-full px-6 pb-12">
          <h3 className="text-lg font-medium text-gray-900 text-center">
            오시는 길
          </h3>

          <p className="mt-3 text-center text-gray-700 leading-relaxed">
            서울특별시 강남구 역삼동 123-45 해피웨딩홀
          </p>

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

          <ul className="mt-5 space-y-2 rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
            <li>• 지하철: 2호선 역삼역 3번 출구에서 도보 7분</li>
            <li>• 버스: 강남역 정류장 하차 후 도보 5분</li>
            <li>• 주차장: 예식장 지하주차장 이용 가능</li>
          </ul>
        </section>

        <section className="w-full px-6 pb-14">
          <h3 className="text-lg font-medium text-gray-900 text-center">
            마음 전하기
          </h3>

          <p className="mt-3 text-center text-sm leading-relaxed text-gray-600">
            참석하지 못하시더라도 축하해 주시는 마음 감사히 받겠습니다.
          </p>

          <div className="mt-5 space-y-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="text-sm font-semibold text-gray-900">
                신랑 측 계좌
              </div>
              <div className="mt-2 text-sm text-gray-700">신한은행</div>

              <div className="mt-2 flex flex-col gap-2">
                <div className="text-sm text-gray-800">110-274-104112</div>
                <button
                  type="button"
                  onClick={() => handleCopy("110-274-104112")}
                  className="w-fit rounded bg-gray-200 px-3 py-1 text-sm"
                >
                  복사하기
                </button>
              </div>

              <div className="mt-2 text-sm text-gray-700">예금주: 오현우</div>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <div className="text-sm font-semibold text-gray-900">
                신부 측 계좌
              </div>
              <div className="mt-2 text-sm text-gray-700">국민은행</div>

              <div className="mt-2 flex flex-col gap-2">
                <div className="text-sm text-gray-800">220-987-654321</div>
                <button
                  type="button"
                  onClick={() => handleCopy("220-987-654321")}
                  className="w-fit rounded bg-gray-200 px-3 py-1 text-sm"
                >
                  복사하기
                </button>
              </div>

              <div className="mt-2 text-sm text-gray-700">예금주: 최인영</div>
            </div>
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

        <section className="w-full px-6 pb-10">
          <h3 className="text-lg font-medium text-gray-900 text-center">
            청첩장 공유하기
          </h3>

          <button
            type="button"
            onClick={shareToKakao}
            className="mt-4 w-full rounded-lg bg-[#FEE500] py-3 text-black font-bold"
          >
            카카오톡으로 공유하기
          </button>
        </section>

        {/* 카피라이트 섹션 */}
        <footer className="w-full py-8 text-center border-t border-gray-100 bg-white mt-10">
          <p className="text-xs text-gray-400 font-light tracking-widest">
            © 2026 Oh. All rights reserved.
          </p>
        </footer>
      </main>
    </>
  );
}
