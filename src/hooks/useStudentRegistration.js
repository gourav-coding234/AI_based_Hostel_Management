import { useCollection } from "./useCollection";

/** Resolves the academic registration number from the signed-in student's
 * account email. The Student Register is readable to every authenticated
 * role, and this query is constrained to a single account. */
export function useStudentRegistration(email) {
  const query = useCollection("studentRegister", {
    where: email ? [["email", "==", email.trim().toLowerCase()]] : [],
    skip: !email,
  });
  const record = query.data[0] || null;
  return { ...query, registrationNo: record?.regNo || record?.registrationNo || "" };
}
