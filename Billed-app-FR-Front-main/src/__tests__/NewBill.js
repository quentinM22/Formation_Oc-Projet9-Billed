/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom"
import { fireEvent, screen } from "@testing-library/dom"

import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"

import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store.js"

import { ROUTES, ROUTES_PATH } from "../constants/routes.js"
import router from "../app/Router.js"

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
	describe("When I am on NewBill Page", () => {
		beforeEach(() => {
			Object.defineProperty(window, "localStorage", { value: localStorageMock })
			window.localStorage.setItem(
				"user",
				JSON.stringify({
					type: "Employee",
				})
			)
			const root = document.createElement("div")
			root.setAttribute("id", "root")
			document.body.append(root)
			router()
			window.onNavigate(ROUTES_PATH.NewBill)
		})
		// Test unitaire: icon-mail
		test("Then bill icon in vertical layout should be highlighted", async () => {
			await screen.findByTestId("icon-mail")
			const mailIcon = screen.getByTestId("icon-mail")
			expect(mailIcon.classList.contains("active-icon"))
		})
		// Test Upload Fichier
		describe("When j'upload un fichier", () => {
			// Test unitaire: format fichier upload
			test("Then la compatatibilité du fichier uploader", () => {
				const onNavigate = (pathname) => {
					document.body.innerHTML = ROUTES({ pathname })
				}
				const newBill = new NewBill({
					document,
					onNavigate,
					localStorage: window.localStorage,
					store: mockStore,
				})
				const errorMessage = screen.getByTestId("error-file")
				const fileUp = screen.getByTestId("file")
				const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e))
				const file = new File(["test"], "test.png", { type: "image/png" })

				fileUp.addEventListener("change", handleChangeFile)
				fireEvent.change(fileUp, { target: { files: [file] } })

				expect(handleChangeFile).toHaveBeenCalled()
				expect(fileUp.files[0]).toStrictEqual(file)
				expect(errorMessage).toHaveAttribute("hidden")
			})
			test("Then l'incompatatibilité du fichier uploader", () => {
				const onNavigate = (pathname) => {
					document.body.innerHTML = ROUTES({ pathname })
				}
				const newBill = new NewBill({
					document,
					onNavigate,
					localStorage: window.localStorage,
					store: mockStore,
				})

				const errorMessage = screen.getByTestId("error-file")
				const fileUp = screen.getByTestId("file")
				const handleChangeFile = jest.fn(newBill.handleChangeFile)
				const file = new File(["test"], "test.pdf", { type: "image/pdf" })

				fileUp.addEventListener("change", (e) => handleChangeFile(e))
				fireEvent.change(fileUp, { target: { files: [file] } })

				expect(handleChangeFile).toHaveBeenCalled()
				expect(errorMessage).not.toHaveAttribute("hidden")
			})
		})
	})
})
// Test intégration: Post Bill
describe("Givent I am connected as an employee", () => {
	describe("When Je valide le formulaire", () => {
		// test: Envoi Api simulé Post
		test("fetches bills to mock API POST", () => {
			document.body.innerHTML = NewBillUI()
			const onNavigate = (pathname) => {
				document.body.innerHTML = ROUTES({ pathname })
			}

			Object.defineProperty(window, "localStorage", {
				value: localStorageMock,
			})
			window.localStorage.setItem(
				"user",
				JSON.stringify({
					type: "Employee",
					email: "a@a",
				})
			)

			const newBill = new NewBill({
				document,
				onNavigate,
				localStorage: window.localStorage,
				store: null,
			})

			const bill = {
				type: "Hôtel et logement",
				name: "Hôtel de Test",
				date: "2023-03-08",
				amount: 200,
				vat: 70,
				pct: 10,
				commentary: "no Comment",
				fileUrl: "../img/test.png",
				fileName: "test.png",
				status: "refused",
			}

			screen.getByTestId("expense-type").value = bill.type
			screen.getByTestId("expense-name").value = bill.name
			screen.getByTestId("datepicker").value = bill.date
			screen.getByTestId("amount").value = bill.amount
			screen.getByTestId("vat").value = bill.vat
			screen.getByTestId("pct").value = bill.pct
			screen.getByTestId("commentary").value = bill.commentary

			newBill.fileName = bill.fileName
			newBill.fileUrl = bill.fileUrl

			newBill.updateBill = jest.fn()
			const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))

			const form = screen.getByTestId("form-new-bill")
			form.addEventListener("submit", handleSubmit)
			fireEvent.submit(form)

			expect(handleSubmit).toHaveBeenCalled()
			expect(newBill.updateBill).toHaveBeenCalled()
		})
		describe("When an error occurs on API", () => {
			beforeEach(() => {
				jest.spyOn(mockStore, "bills")
				Object.defineProperty(window, "localStorage", {
					value: localStorageMock,
				})
				window.localStorage.setItem(
					"user",
					JSON.stringify({
						type: "Employee",
						email: "a@a",
					})
				)
				const root = document.createElement("div")
				root.setAttribute("id", "root")
				document.body.appendChild(root)
				router()
			})
			// Test unitaire: Erreur 500
			test("fetches messages from an API and fails with 500 message error", async () => {
				jest.spyOn(mockStore, "bills")
				jest.spyOn(console, "error").mockImplementation(() => {})

				Object.defineProperty(window, "localStorage", {
					value: localStorageMock,
				})
				Object.defineProperty(window, "location", {
					value: { hash: ROUTES_PATH["NewBill"] },
				})

				window.localStorage.setItem(
					"user",
					JSON.stringify({ type: "Employee" })
				)
				document.body.innerHTML = `<div id="root"></div>`
				router()

				const onNavigate = (pathname) => {
					document.body.innerHTML = ROUTES({ pathname })
				}

				mockStore.bills.mockImplementationOnce(() => {
					return {
						update: () => {
							return Promise.reject(new Error("Erreur 500"))
						},
					}
				})
				const newBill = new NewBill({
					document,
					onNavigate,
					store: mockStore,
					localStorage: window.localStorage,
				})

				const form = screen.getByTestId("form-new-bill")
				const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
				form.addEventListener("submit", handleSubmit)
				fireEvent.submit(form)
				await new Promise(process.nextTick)
				expect(console.error).toHaveBeenCalled()
			})
		})
	})
})
