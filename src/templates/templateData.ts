// Import types

import { constants } from "../constants";
const { typeEnum, MailType } = constants.generalConstant.en.templateData;
import {
 
  GetOtpTemplateDataType,
  sessionBookingNotificationTemplateData,
  userOnboardingTemplateData, 
} from "../types";


export const getOtpTemplateData = ({ data, type }: GetOtpTemplateDataType) => {
  if (type === typeEnum.VERIFICATION) {
    return {
      mailSubject: "Email Verification",
      mailBody: `
				<p style="font-weight: 600; font-size: 18px; margin-bottom: 0;">Hi, User</p>
				<p>OTP for your email verification is :</p>
				<p style="font-weight: 600; font-size: 18px; margin-bottom: 0;">${data.otp}</p>
				<p>This OTP is valid for only 10 minutes</p>
			`,
    };
  } else if (type === typeEnum.RESET) {
    return {
      mailSubject: "Password Reset",
      mailBody: `
				<p style="font-weight: 600; font-size: 18px; margin-bottom: 0;">Hi, User</p>
				<p>OTP for your password reset request is :</p>
				<p style="font-weight: 600; font-size: 18px; margin-bottom: 0;">${data.otp}</p>
				<p>This OTP is valid for only 10 minutes</p>
			`,
    };
  } else {
    return {
      mailSubject: "Two Factor Authentication",
      mailBody: `
				<p style="font-weight: 600; font-size: 18px; margin-bottom: 0;">Hi, User</p>
				<p>OTP for your 2FA is :</p>
				<p style="font-weight: 600; font-size: 18px; margin-bottom: 0;">${data.otp}</p>
				<p>This OTP is valid for only 10 minutes</p>
			`,
    };
  }
};

export const adminOnboardingTemplateData = ({
  names,
  password,
  role,
}: userOnboardingTemplateData) => {
  return {
    mailSubject: "Admin Onboarding",
    mailBody: `
			<p style="font-weight: 600; font-size: 18px; margin-bottom: 0;">Welcome onboard, ${names.split(" ")[0]}</p>
			<p>A ${role} admnistrative account has been registered for you.</p>
			<p>Your default password is "${password}" </p>
			<p>Pls login with your email and the default password.</p>
			<p>You will be prompted to change your account's default's password upon login.</p>
		`,
  };
};

export const getNotificationTemplateData = ({ data, type }: { data: any; type: (typeof MailType)[keyof typeof MailType] }) => {
  if (type === MailType.REG_SUCCESS) {
    return {
      mailSubject: "Welcome On Board",
      mailBody: `
				<p style="font-weight: 600; font-size: 18px; margin-bottom: 0;">Hi, ${data.name}</p>
				<p>Welcome to 911Command!</p>
				<p>Some other message</p>
			`,
    };
  } else if (type === MailType.BOOK_SUCCESS) {
    return {
      mailSubject: `[${data.bookingId}] Booking Successfull`,
      mailBody: `
				<p style="font-weight: 600; font-size: 18px; margin-bottom: 0;">Hi, ${data.name}</p>
				<p>Your Booking has been received, below is your booking ID.</p>
				<p style="font-weight: 600; font-size: 18px; margin-bottom: 0;">${data.bookingId}</p>
				<p>You can login to your account to see more details.</p>
			`,
    };
  } else if (type === MailType.BOOK_PAYMENT_SUCCESS) {
    return {
      mailSubject: `[${data.bookingId}] Booking Payment Success`,
      mailBody: `
				<p style="font-weight: 600; font-size: 18px; margin-bottom: 0;">Hi, ${data.name}</p>
				<p>Payment for Booking ID ${data.bookingId} was successfull.</p>
				<p>You can login to your account to see more details.</p>
			`,
    };
  } else if (type === MailType.BOOK_PAYMENT_FAILED) {
    return {
      mailSubject: `[${data.bookingId}] Booking Payment Failed`,
      mailBody: `
				<p style="font-weight: 600; font-size: 18px; margin-bottom: 0;">Hi, ${data.name}</p>
				<p>Payment for Booking ID ${data.bookingId} was not successful</p>
				<p>You can login to your account to see more details.</p>
			`,
    };
  } else if (type === MailType.BOOK_EXPIRED) {
    return {
      mailSubject: `[${data.bookingId}] Booking Expired`,
      mailBody: `
				<p style="font-weight: 600; font-size: 18px; margin-bottom: 0;">Hi, ${data.name}</p>
				<p>Your booking ID ${data.bookingId} has expired and been removed. Kidnly make another booking from your account.</p>
			`,
    };
  } else if (type === MailType.TICKET_CONFIRMED) {
    return {
      mailSubject: `[${data.bookingId}] Ticket Confirmed`,
      mailBody: `
				<p style="font-weight: 600; font-size: 18px; margin-bottom: 0;">Hi, ${data.name}</p>
				<p>Ticket for your booking ID ${data.bookingId} has been confirmed.</p>
				<p>You can login to your account to see more details.</p>
			`,
    };
  }  else if (type === MailType.INSUFFICIENT_TRANSACTION_AMOUNT) {
    return {
      mailSubject: `[${data.bookingId}] Booking Payment Balance Refund`,
      mailBody: `
				<p style="font-weight: 600; font-size: 18px; margin-bottom: 0;">Hi, ${data.name}</p>
				<p>Payment for Booking ID ${data.bookingId} was not successful. This is because the transaction amount received and processed is insufficient for this booking.</p>
				<p>A refund has been made to your wallet. These funds will be available to use as a payment option at the point of payment for another booking.</p>
			`,
    };
  } else if (type === MailType.TOO_MUCH_TRANSACTION_AMOUNT) {
  }
};

export const adminFlightBookingNotificationTemplateData = ({
  user,
  flightDetails,
}: sessionBookingNotificationTemplateData) => {
  return {
    mailSubject: "Notification For Flight Booking",
    mailBody: `
			<p style="font-weight: 600; font-size: 18px; margin-bottom: 0;">Hi,</p>
			<p>This is to let you know that a flight was successfully booked, the following are the basic details of the flight:</p>
			<div>
				<div><u>User Information</u></div>
				<div><b>Full Name:</b> ${user.fullname}</div>
				<div><b>Email:</b> ${user.email}</div>
				<br/>
				<div><u>Flight Information</u></div>
				<div><b>Flight ID:</b> ${flightDetails.id}</div>
			</div>
		`,
  };
};