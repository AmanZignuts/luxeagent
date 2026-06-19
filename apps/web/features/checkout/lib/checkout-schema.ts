import * as yup from "yup";

export const checkoutSchema = yup.object().shape({
  fullName: yup
    .string()
    .required("Full name is required.")
    .matches(/^[A-Za-z\s\-]+$/, "Full name must contain only letters and spaces."),
  email: yup.string().email("Please enter a valid email format.").required("Email address is required."),
  address: yup.string().min(8, "Please enter a complete delivery address.").required("Delivery address is required."),
  usingSavedCard: yup.boolean().default(true),
  editingCard: yup.boolean().default(false),
  cardNumber: yup.string().when(["usingSavedCard", "editingCard"], {
    is: (usingSaved: boolean, editing: boolean) => !usingSaved || editing,
    then: (schema) =>
      schema
        .required("Card number is required.")
        .test("len", "Please enter a valid 16-digit card number.", (val) => val?.replace(/[\s•]/g, "").length === 16),
    otherwise: (schema) => schema.notRequired(),
  }),
  cardName: yup.string().when(["usingSavedCard", "editingCard"], {
    is: (usingSaved: boolean, editing: boolean) => !usingSaved || editing,
    then: (schema) =>
      schema
        .required("Cardholder name is required.")
        .matches(/^[A-Za-z\s\-]+$/, "Cardholder name must contain only letters and spaces."),
    otherwise: (schema) => schema.notRequired(),
  }),
  cardExpiry: yup.string().when(["usingSavedCard", "editingCard"], {
    is: (usingSaved: boolean, editing: boolean) => !usingSaved || editing,
    then: (schema) =>
      schema.required("Expiry is required.").matches(/^(0[1-9]|1[0-2])\/\d{2}$/, "Please enter expiry in MM/YY format."),
    otherwise: (schema) => schema.notRequired(),
  }),
  cardCvv: yup
    .string()
    .required("CVV is required to confirm payment.")
    .min(3, "CVV must be 3 or 4 digits.")
    .max(4, "CVV must be 3 or 4 digits."),
});

export type CheckoutFormValues = yup.InferType<typeof checkoutSchema>;
